import type { SupabaseClient } from '@supabase/supabase-js'
import { updateExam, type ExamRow } from './exams'
import { updateScholarship, type ScholarshipRow } from './scholarships'
import { updateNirf } from './nirf'
import { updateCollege, type CollegeRow } from './colleges'
import { updateNirfPlacements } from './nirf-data'
import { updateCollegeDetails, type CollegeDetailRow } from './college-details'
import { updateJosaaCutoffs } from './josaa'
import type { ProposalOutcome } from './proposals'
import { AiQuotaError } from './llm'

export type RunOptions = {
  targets: ('exams' | 'scholarships' | 'colleges' | 'nirf' | 'placements' | 'college_details' | 'cutoffs')[]
  mode: 'full' | 'hot' | 'single'
  slug?: string             // exam slug (mode=single)
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
}

type Stats = Record<ProposalOutcome | 'checked' | 'skipped' | 'dropped', number>

const RECHECK_HOURS = 20

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
  const remaining = { exams: 0, scholarships: 0, colleges: 0, college_details: 0, nirf: 0 }
  const dueAtStart = { exams: 0, scholarships: 0, colleges: 0, college_details: 0 }
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
    if (r.skipped) { stats.skipped++; log.push(`${name}: skipped (${r.skipped})`) }
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

    // Runs before the NAAC/founded check: it is the bigger gap, and both share the daily AI limit
    // ------- College details: programmes & fees, placement reports, admission, scholarships -------
    if (opts.targets.includes('college_details') && opts.mode !== 'single') {
      const { data: rows, error } = await db
        .from('colleges')
        .select('id, name, website_url, admission_process, admission_verified_at, annual_fees_min, annual_fees_max, fees_verified_at, institute_scholarships, last_checked_at:details_checked_at')
        .eq('automation_enabled', true)
        .not('website_url', 'is', null)
        .order('details_checked_at', { ascending: true, nullsFirst: true })
      if (error) throw new Error(`college details query failed: ${error.message}`)
      let list = due((rows ?? []) as (CollegeDetailRow & { last_checked_at: string | null })[], opts)
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
    if (opts.targets.includes('colleges') && opts.mode !== 'single') {
      const { data: rows, error } = await db
        .from('colleges')
        .select('id, name, website_url, naac_grade, established_year, annual_fees_min, annual_fees_max, verified_at, last_checked_at')
        .eq('automation_enabled', true)
        .not('website_url', 'is', null)
        .order('last_checked_at', { ascending: true, nullsFirst: true })
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
      const r = await updateJosaaCutoffs(db, { dryRun })
      log.push(`JoSAA ${r.years.join(', ')}: ${r.rows} cutoff rows for ${r.colleges} colleges`)
      for (const e of r.errors) errors.push({ item: 'cutoffs', error: e })
    }

    // ------------- Official placements from NIRF data sheets -------------
    // Deterministic (no AI), so it is not limited by the Groq quota
    if (opts.targets.includes('placements') && opts.mode === 'full' && !timeUp()) {
      console.log('\n💼 NIRF placement data (median salary, placed, higher studies)')
      const r = await updateNirfPlacements(db, { runId, dryRun, limit: opts.limit })
      log.push(`NIRF placements: ${r.colleges} colleges with official sheets, ${r.rows} rows changed`)
      for (const o of r.outcomes) stats[o]++
      for (const e of r.errors) errors.push({ item: 'placements', error: e })
      for (const i of r.issues.slice(0, 50)) log.push(`median left empty: ${i}`)
    }
  } catch (err) {
    errors.push({ item: 'run', error: (err as Error).message })
    if (err instanceof AiQuotaError) quotaStop = err.message
  }

  // Old hand-typed / third-party values are deleted once an official value replaces them
  if (!dryRun) {
    const { data: retired, error: retireErr } = await db.rpc('retire_replaced_unverified')
    if (retireErr) errors.push({ item: 'retire', error: retireErr.message })
    else if (retired) log.push(`replaced old values: ${JSON.stringify(retired)}`)
  }

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
      .update({ finished_at: new Date().toISOString(), status: runStatus, stats: total, errors: allErrors.slice(0, 200) })
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

  console.log('\n📊 Summary:', stats)
  if (errors.length) console.log(`⚠️ ${errors.length} fetch/parse errors (see automation_runs.errors)`)
  return { runId, status, stats, errors, log, remaining, dueAtStart, quotaStop }
}
