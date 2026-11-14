import type { SupabaseClient } from '@supabase/supabase-js'
import { updateExam, type ExamRow } from './exams'
import { updateScholarship, type ScholarshipRow } from './scholarships'
import { updateNirf } from './nirf'
import { updateCollege, type CollegeRow } from './colleges'
import { updateNirfPlacements } from './nirf-data'
import { updateCollegeDetails, type CollegeDetailRow } from './college-details'
import { updateJosaaCutoffs } from './josaa'
import { updateSyllabus } from './syllabus'
import { updateExamCutoffs } from './exam-cutoffs'
import { updateCareer, type CareerRow } from './careers'
import { updateCollegeCutoffs, type CollegeCutoffRow } from './college-cutoffs'
import { updateExamRules } from './exam-rules'
import type { ProposalOutcome } from './proposals'
import { AiQuotaError } from './llm'

export type RunOptions = {
  targets: ('exams' | 'scholarships' | 'colleges' | 'nirf' | 'placements' | 'college_details' | 'cutoffs' | 'college_cutoffs' | 'syllabus' | 'exam_cutoffs' | 'exam_rules' | 'careers')[]
  mode: 'full' | 'hot' | 'single'
  slug?: string             // exam slug (mode=single)
  collegeId?: string        // one college (mode=single, college targets)
  limit?: number
  dryRun?: boolean
  force?: boolean           // ignore page cache / recently-checked
  trigger?: 'schedule' | 'manual' | 'github'
  deadlineMs?: number       // stop starting new records after this (serverless limits)
  // "Update everything" sweep: the admin page calls the runner in batches until
  // nothing is left. Records already touched since sweepStartedAt are skipped,
  // and every attempted record is stamped, so a dead site cannot stall the loop.
  sweepStartedAt?: string
  runId?: string            // continue (add to) an existing automation_runs row
  notify?: boolean          // default true
  // Sweep position for the step-wise targets (JoSAA year, NIRF placement offset); returned as `cursor`
  cursor?: number
}

type Stats = Record<ProposalOutcome | 'checked' | 'skipped' | 'dropped', number>

const RECHECK_HOURS = 20
const RETRY_UNREAD_HOURS = 6

/** Records still due in this run: not checked since the sweep began (or in the last RECHECK_HOURS). */
function due<T extends { last_checked_at: string | null }>(list: T[], opts: RunOptions): T[] {
  if (opts.mode === 'single') return list
  if (opts.sweepStartedAt) {
    const start = new Date(opts.sweepStartedAt).getTime()
    return list.filter((r) => !r.last_checked_at || new Date(r.last_checked_at).getTime() < start)
  }
  if (opts.force) return list
  const cutoff = Date.now() - RECHECK_HOURS * 3600_000
  return list.filter((r) => !r.last_checked_at || new Date(r.last_checked_at).getTime() < cutoff)
}

/** "Hot" exams: registration open, or an exam/result within the next 90 days, or no upcoming cycle on file. */
async function hotExamIds(db: SupabaseClient): Promise<Set<string>> {
  const today = new Date().toISOString().slice(0, 10)
  const in90 = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)
  const { data } = await db.from('exam_schedules').select('exam_id, registration_start, registration_end, exam_date_start, result_date, year')
  const ids = new Set<string>()
  const hasUpcoming = new Set<string>()
  for (const s of data ?? []) {
    const regOpen = s.registration_start && s.registration_start <= today && (!s.registration_end || s.registration_end >= today)
    const soon = [s.exam_date_start, s.result_date].some((d) => d && d >= today && d <= in90)
    if (regOpen || soon) ids.add(s.exam_id)
    if (s.exam_date_start ? s.exam_date_start >= today : s.year >= new Date().getFullYear()) hasUpcoming.add(s.exam_id)
  }
  const { data: exams } = await db.from('exams').select('id')
  for (const e of exams ?? []) if (!hasUpcoming.has(e.id)) ids.add(e.id)
  return ids
}

export async function runAutomation(db: SupabaseClient, opts: RunOptions) {
  const dryRun = !!opts.dryRun
  const stats: Stats = { checked: 0, skipped: 0, dropped: 0, auto_applied: 0, pending: 0, duplicate: 0, failed: 0 }
  const errors: { item: string; error: string }[] = []
  const log: string[] = []
  const timeUp = () => opts.deadlineMs !== undefined && Date.now() > opts.deadlineMs
  const remaining = { exams: 0, scholarships: 0, colleges: 0, college_details: 0, college_cutoffs: 0, syllabus: 0, exam_cutoffs: 0, exam_rules: 0, careers: 0, nirf: 0, cutoffs: 0, placements: 0 }
  const dueAtStart = { exams: 0, scholarships: 0, colleges: 0, college_details: 0, college_cutoffs: 0, syllabus: 0, exam_cutoffs: 0, exam_rules: 0, careers: 0, cutoffs: 0, placements: 0 }
  let cursor: number | undefined
  let quotaStop: string | undefined
  const stamp = async (table: 'exams' | 'scholarships' | 'colleges', id: string, column = 'last_checked_at') => {
    if (opts.sweepStartedAt) await db.from(table).update({ [column]: new Date().toISOString() }).eq('id', id)
  }

  let runId: string | null = opts.runId ?? null
  if (!dryRun && !runId) {
    const { data, error } = await db
      .from('automation_runs')
      .insert({ trigger: opts.trigger ?? 'manual', mode: opts.mode })
      .select('id')
      .single()
    if (error) throw new Error(`Cannot create automation run (did you run supabase/automation-v2.sql?): ${error.message}`)
    runId = data.id
  }

  const tally = (r: { outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[] }, name: string) => {
    stats.checked++
    if (r.skipped) { stats.skipped++; log.push(`${name}: skipped (${r.skipped})`); console.log(`    ⏭️ skipped: ${r.skipped}`) }
    for (const o of r.outcomes) stats[o]++
    stats.dropped += r.dropped.length
    for (const d of r.dropped) console.log(`    🚫 ${d}`)
    for (const e of r.errors) errors.push({ item: name, error: e })
  }

  try {
    // ---------------- Exams ----------------
    if (opts.targets.includes('exams')) {
      let q = db.from('exams').select('id, name, slug, official_url, source_urls, last_checked_at').not('official_url', 'is', null)
      if (opts.mode === 'single' && opts.slug) q = q.eq('slug', opts.slug)
      else q = q.eq('automation_enabled', true)
      const { data: exams, error } = await q.order('last_checked_at', { ascending: true, nullsFirst: true })
      if (error) throw new Error(`exams query failed: ${error.message}`)

      let list = (exams ?? []) as (ExamRow & { last_checked_at: string | null })[]
      if (opts.mode === 'hot') {
        const hot = await hotExamIds(db)
        list = list.filter((e) => hot.has(e.id))
      }
      list = due(list, opts)
      if (opts.limit) list = list.slice(0, opts.limit)

      console.log(`\n📚 Exams to check: ${list.length}`)
      remaining.exams = dueAtStart.exams = list.length
      for (const exam of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  🔍 ${exam.name}`)
        try {
          tally(await updateExam(db, exam, { runId, dryRun, force: !!opts.force }), exam.slug)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: exam.slug, error: (err as Error).message })
          console.error(`  ❌ ${exam.slug}:`, (err as Error).message)
        }
        await stamp('exams', exam.id)
        remaining.exams--
      }
    }

    // ---------------- Scholarships ----------------
    if (opts.targets.includes('scholarships') && opts.mode !== 'single') {
      const { data: rows } = await db
        .from('scholarships')
        .select('id, name, provider, application_url, application_deadline, amount_min, amount_max, verified_at, last_checked_at')
        .eq('automation_enabled', true)
        .not('application_url', 'is', null)
        .order('last_checked_at', { ascending: true, nullsFirst: true })
      let list = due((rows ?? []) as (ScholarshipRow & { last_checked_at: string | null })[], opts)
      if (opts.limit) list = list.slice(0, opts.limit)
      console.log(`\n🎓 Scholarships to check: ${list.length}`)
      remaining.scholarships = dueAtStart.scholarships = list.length
      for (const s of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  🔍 ${s.name}`)
        try {
          tally(await updateScholarship(db, s, { runId, dryRun, force: !!opts.force }), s.name)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: s.name, error: (err as Error).message })
        }
        await stamp('scholarships', s.id)
        remaining.scholarships--
      }
    }

    // ------- Careers: eligibility, route in, licence, pay from the official body -------
    if (opts.targets.includes('careers') && opts.mode !== 'single') {
      const { data: rows, error } = await db
        .from('careers')
        .select('id, title, slug, official_body, official_url, source_urls, eligibility, how_to_enter, licence, official_pay, official_pay_min, official_pay_max, verified_at, facts_read_at, last_checked_at')
        .eq('automation_enabled', true)
        .order('last_checked_at', { ascending: true, nullsFirst: true })
      if (error) throw new Error(`careers query failed: ${error.message}`)
      // A career with no website of its own is read from the official sites of the exams that lead
      // into it (UPSC for civil services, NMC/NTA for medicine…); with neither, there is nothing to read.
      const { data: links } = await db.from('career_exams').select('career_id, exams ( official_url, source_urls, conducting_body )')
      const viaExams = new Map<string, { urls: string[]; body: string | null }>()
      for (const l of (links ?? []) as unknown as { career_id: string; exams: { official_url: string | null; source_urls: string[] | null; conducting_body: string | null } | null }[]) {
        if (!l.exams?.official_url) continue
        const v = viaExams.get(l.career_id) ?? { urls: [], body: l.exams.conducting_body }
        v.urls.push(l.exams.official_url, ...(l.exams.source_urls ?? []).slice(0, 1))
        viaExams.set(l.career_id, v)
      }
      const withSources = ((rows ?? []) as (CareerRow & { last_checked_at: string | null })[]).flatMap((c) => {
        if (c.official_url) return [c]
        const v = viaExams.get(c.id)
        if (!v) return []
        const urls = [...new Set(v.urls)].slice(0, 3)
        return [{ ...c, official_url: urls[0], source_urls: urls.slice(1), official_body: c.official_body ?? v.body }]
      })
      let list = due(withSources, opts)
      if (opts.limit) list = list.slice(0, opts.limit)
      console.log(`
💼 Careers to check: ${list.length}`)
      remaining.careers = dueAtStart.careers = list.length
      for (const c of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  🔍 ${c.title}`)
        try {
          tally(await updateCareer(db, c, { runId, dryRun, force: !!opts.force }), c.title)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: c.title, error: (err as Error).message })
        }
        // Stamped even after a failure so one broken site cannot stall the queue
        if (!dryRun) await db.from('careers').update({ last_checked_at: new Date().toISOString() }).eq('id', c.id)
        remaining.careers--
      }
    }

    // Runs before the NAAC/founded check: it is the bigger gap, and both share the daily AI limit
    // ------- College details: programmes & fees, placement reports, admission, scholarships -------
    if (opts.targets.includes('college_details') && (opts.mode !== 'single' || opts.collegeId)) {
      let q = db
        .from('colleges')
        .select('id, name, website_url, admission_process, admission_verified_at, annual_fees_min, annual_fees_max, fees_verified_at, institute_scholarships, details_read_at, application_opens, application_closes, last_checked_at:details_checked_at')
        .not('website_url', 'is', null)
      q = opts.collegeId ? q.eq('id', opts.collegeId) : q.eq('automation_enabled', true)
      const { data: rows, error } = await q.order('details_checked_at', { ascending: true, nullsFirst: true })
      if (error) throw new Error(`college details query failed: ${error.message}`)
      const all = (rows ?? []) as (CollegeDetailRow & { last_checked_at: string | null })[]
      let list = due(all, opts)
      // A college never read yet (site down, network dropped, AI busy) is tried again sooner than one already read
      if (opts.mode !== 'single' && !opts.sweepStartedAt && !opts.force) {
        const retryBefore = Date.now() - RETRY_UNREAD_HOURS * 3600_000
        const again = all.filter((r) => !r.details_read_at && r.last_checked_at && new Date(r.last_checked_at).getTime() < retryBefore && !list.includes(r))
        list = [...list, ...again]
      }
      if (opts.limit) list = list.slice(0, opts.limit)
      console.log(`\n🏫 College details to read: ${list.length}`)
      remaining.college_details = dueAtStart.college_details = list.length
      for (const c of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  🔍 ${c.name}`)
        try {
          tally(await updateCollegeDetails(db, c, { runId, dryRun, force: !!opts.force }), c.name)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: c.name, error: (err as Error).message })
        }
        // Stamped even after a failure so one broken site cannot stall the queue
        if (!dryRun) await db.from('colleges').update({ details_checked_at: new Date().toISOString() }).eq('id', c.id)
        remaining.college_details--
      }
    }

    // ---------------- Colleges (own website) ----------------
    if (opts.targets.includes('colleges') && (opts.mode !== 'single' || opts.collegeId)) {
      let q = db
        .from('colleges')
        .select('id, name, website_url, naac_grade, established_year, annual_fees_min, annual_fees_max, verified_at, last_checked_at')
        .not('website_url', 'is', null)
      q = opts.collegeId ? q.eq('id', opts.collegeId) : q.eq('automation_enabled', true)
      const { data: rows, error } = await q.order('last_checked_at', { ascending: true, nullsFirst: true })
      if (error) throw new Error(`colleges query failed: ${error.message}`)
      let list = due((rows ?? []) as (CollegeRow & { last_checked_at: string | null })[], opts)
      if (opts.limit) list = list.slice(0, opts.limit)
      console.log(`\n🏛️ Colleges to check: ${list.length}`)
      remaining.colleges = dueAtStart.colleges = list.length
      for (const c of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  🔍 ${c.name}`)
        try {
          tally(await updateCollege(db, c, { runId, dryRun, force: !!opts.force }), c.name)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: c.name, error: (err as Error).message })
        }
        await stamp('colleges', c.id)
        remaining.colleges--
      }
    }

    // ------- Official college cutoffs (every exam except JEE, which comes from JoSAA) -------
    if (opts.targets.includes('college_cutoffs') && (opts.mode !== 'single' || opts.collegeId)) {
      let q = db.from('colleges').select('id, name, city, website_url, cutoffs_read_at, last_checked_at:cutoffs_checked_at').not('website_url', 'is', null)
      q = opts.collegeId ? q.eq('id', opts.collegeId) : q.eq('automation_enabled', true)
      const { data: rows, error } = await q.order('cutoffs_checked_at', { ascending: true, nullsFirst: true })
      if (error) throw new Error(`college cutoffs query failed: ${error.message}`)
      let list = due((rows ?? []) as (CollegeCutoffRow & { last_checked_at: string | null })[], opts)
      if (opts.limit) list = list.slice(0, opts.limit)
      console.log(`\nCollege cutoffs to read: ${list.length}`)
      remaining.college_cutoffs = dueAtStart.college_cutoffs = list.length
      for (const c of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  checking ${c.name}`)
        try {
          const r = await updateCollegeCutoffs(db, c, { dryRun, force: !!opts.force })
          tally(r, c.name)
          log.push(...r.log)
          for (const line of r.log) console.log(`    ${line}`)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: c.name, error: (err as Error).message })
        }
        // Stamped even after a failure so one broken site cannot stall the queue
        if (!dryRun) await db.from('colleges').update({ cutoffs_checked_at: new Date().toISOString() }).eq('id', c.id)
        remaining.college_cutoffs--
      }
    }

    // ------- Official syllabus and official exam cutoffs (one AI read each per exam) -------
    for (const target of ['syllabus', 'exam_cutoffs', 'exam_rules'] as const) {
      if (!opts.targets.includes(target)) continue
      const column = target === 'syllabus' ? 'syllabus_checked_at' : target === 'exam_cutoffs' ? 'cutoffs_checked_at' : 'rules_checked_at'
      let q = db.from('exams').select(`id, name, slug, official_url, source_urls, syllabus_source_url, syllabus_read_at, cutoffs_read_at, rules_read_at, last_checked_at:${column}`).not('official_url', 'is', null)
      q = opts.mode === 'single' && opts.slug ? q.eq('slug', opts.slug) : q.eq('automation_enabled', true)
      const { data: rows, error } = await q.order(column, { ascending: true, nullsFirst: true })
      if (error) throw new Error(`${target} query failed: ${error.message}`)
      let list = due((rows ?? []) as unknown as (ExamRow & { last_checked_at: string | null })[], opts)
      if (opts.limit) list = list.slice(0, opts.limit)
      console.log(`
${target === 'syllabus' ? '📖 Exam syllabi' : target === 'exam_cutoffs' ? '📏 Exam cutoffs' : '🧾 Exam patterns & eligibility'} to read: ${list.length}`)
      remaining[target] = dueAtStart[target] = list.length
      for (const exam of list) {
        if (timeUp()) { log.push('Stopped early: time budget reached'); break }
        console.log(`  🔍 ${exam.name}`)
        try {
          const r = target === 'syllabus'
            ? await updateSyllabus(db, exam, { dryRun, force: !!opts.force })
            : target === 'exam_cutoffs'
              ? await updateExamCutoffs(db, exam, { dryRun, force: !!opts.force })
              : await updateExamRules(db, exam, { runId, dryRun, force: !!opts.force })
          tally(r, exam.slug)
          log.push(...r.log)
          for (const line of r.log) console.log(`    ${line}`)
        } catch (err) {
          if (err instanceof AiQuotaError) throw err
          errors.push({ item: exam.slug, error: (err as Error).message })
        }
        // Stamped even after a failure so one broken site cannot stall the queue
        if (!dryRun) await db.from('exams').update({ [column]: new Date().toISOString() }).eq('id', exam.id)
        remaining[target]--
      }
    }

    // ---------------- NIRF ----------------
    if (opts.targets.includes('nirf') && opts.mode === 'full' && timeUp()) remaining.nirf = 1
    else if (opts.targets.includes('nirf') && opts.mode === 'full') {
      console.log('\n🏆 NIRF rankings')
      const r = await updateNirf(db, { runId, dryRun })
      log.push(r.year ? `NIRF ${r.year}: matched ${r.matched} colleges` : 'NIRF: not available')
      for (const o of r.outcomes) stats[o]++
      for (const e of r.errors) errors.push({ item: 'nirf', error: e })
    }

    // ------------- Official JEE cutoffs from JoSAA (final round, last 6 years) -------------
    if (opts.targets.includes('cutoffs') && opts.mode === 'full' && !timeUp()) {
      console.log('\n🎯 JoSAA opening/closing ranks')
      // A sweep does one admission year per request (cursor = position in the year plan)
      const step = opts.sweepStartedAt ? opts.cursor ?? 0 : undefined
      const r = await updateJosaaCutoffs(db, { dryRun, step })
      log.push(`JoSAA ${r.years.join(', ') || '(no year)'}: ${r.rows} cutoff rows for ${r.colleges} colleges`)
      for (const e of r.errors) errors.push({ item: 'cutoffs', error: e })
      dueAtStart.cutoffs = r.planLength
      if (step !== undefined) { cursor = step + 1; remaining.cutoffs = Math.max(0, r.planLength - cursor) }
    }

    // ------------- Official placements from NIRF data sheets -------------
    // Deterministic (no AI), so it is not limited by the Groq quota
    if (opts.targets.includes('placements') && opts.mode === 'full' && !timeUp()) {
      console.log('\n💼 NIRF placement data (median salary, placed, higher studies)')
      // A sweep does 15 colleges per request (cursor = offset into the alphabetical list)
      const offset = opts.sweepStartedAt ? opts.cursor ?? 0 : 0
      const batch = opts.sweepStartedAt ? 15 : opts.limit
      const r = await updateNirfPlacements(db, { runId, dryRun, limit: batch, offset })
      dueAtStart.placements = r.total
      if (opts.sweepStartedAt) { cursor = offset + (batch ?? 0); remaining.placements = Math.max(0, r.total - cursor) }
      log.push(`NIRF placements: ${r.colleges} colleges with official sheets, ${r.rows} rows changed`)
      for (const o of r.outcomes) stats[o]++
      for (const e of r.errors) errors.push({ item: 'placements', error: e })
      for (const i of r.issues.slice(0, 50)) log.push(`median left empty: ${i}`)
    }
  } catch (err) {
    // Reaching the daily AI limit is an expected stop (the next run continues), not a failed run
    if (err instanceof AiQuotaError) quotaStop = err.message
    else errors.push({ item: 'run', error: (err as Error).message })
  }

  // Old hand-typed / third-party values are deleted once an official value replaces them
  if (!dryRun) {
    const { data: retired, error: retireErr } = await db.rpc('retire_replaced_unverified')
    if (retireErr) errors.push({ item: 'retire', error: retireErr.message })
    else if (retired) log.push(`replaced old values: ${JSON.stringify(retired)}`)
  }
  if (quotaStop) log.push(`Stopped at the daily AI limit: ${quotaStop}`)

  const status = errors.some((e) => e.item === 'run') ? 'failed' : errors.length ? 'partial' : 'success'
  if (runId) {
    // A continued run adds this batch to what earlier batches recorded
    let total: Record<string, unknown> = { ...stats, log }
    let allErrors = errors
    if (opts.runId) {
      const { data: prev } = await db.from('automation_runs').select('stats, errors, status').eq('id', runId).single()
      if (prev) {
        const p = prev.stats as Record<string, number | string[]>
        total = Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, v + Number(p[k] ?? 0)]))
        total.log = [...((p.log as string[]) ?? []), ...log].slice(-100)
        allErrors = [...(prev.errors as typeof errors), ...errors]
      }
    }
    const runStatus = allErrors.some((e) => e.item === 'run') ? 'failed' : allErrors.length ? 'partial' : 'success'
    const { error: saveErr } = await db
      .from('automation_runs')
      // Whole-run errors first, so the 200-entry cap never hides why a run stopped
      .update({ finished_at: new Date().toISOString(), status: runStatus, stats: total, errors: [...allErrors.filter((e) => e.item === 'run'), ...allErrors.filter((e) => e.item !== 'run')].slice(0, 200) })
      .eq('id', runId)
    if (saveErr) console.error('  ❌ could not save the run summary:', saveErr.message)

    if (opts.notify !== false && (stats.pending > 0 || stats.auto_applied > 0)) {
      await db.from('admin_notifications').insert({
        type: 'automation',
        severity: stats.pending > 0 ? 'warning' : 'info',
        title: `Automation: ${stats.auto_applied} updated, ${stats.pending} need review`,
        message: `Checked ${stats.checked} records from official websites. ${stats.auto_applied} changes applied automatically with evidence; ${stats.pending} are waiting in Admin → Automation.`,
        is_read: false,
      })
    }
  }

  // One line, so the GitHub job summary (which greps this log) shows all of it
  console.log('\n📊 Summary:', JSON.stringify(stats))
  if (quotaStop) console.log('⛔ Stopped: daily Groq AI limit reached; the next run continues where this one stopped')
  if (errors.length) console.log(`⚠️ ${errors.length} fetch/parse errors (see automation_runs.errors)`)
  return { runId, status, stats, errors, log, remaining, dueAtStart, quotaStop, cursor }
}
