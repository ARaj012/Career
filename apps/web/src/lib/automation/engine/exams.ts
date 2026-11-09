/**
 * Exam schedules for ALL exams that have an official_url — no per-exam
 * scraper code. Adding a new exam in the admin panel is enough for it to be
 * kept up to date.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { isTentative, quoteSupportsDate } from './evidence'
import { validateSchedule, type ScheduleDates } from './validate'
import { buildContext, gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'
import { hostOf, type LinkFocus } from './http'

const FIELDS = ['registration_start', 'registration_end', 'exam_date_start', 'exam_date_end', 'result_date'] as const
type Field = (typeof FIELDS)[number]

const Fact = z.object({ value: z.string().nullish(), quote: z.string().nullish() }).nullish()
const Output = z.object({
  cycles: z
    .array(
      z.object({
        year: z.coerce.number().int(),
        session: z.string().nullish(),
        tentative: z.boolean().nullish(),
        registration_start: Fact,
        registration_end: Fact,
        exam_date_start: Fact,
        exam_date_end: Fact,
        result_date: Fact,
      })
    )
    .default([]),
})

const KEYWORDS =
  /(registration|application|apply|last date|closing|commence|examination date|exam date|result|declar|schedule|session|phase|important dates|admit card|notification)/i

export type ExamRow = {
  id: string
  name: string
  slug: string
  official_url: string | null
  source_urls: string[] | null
}

type ScheduleRow = ScheduleDates & { id: string; year: number; session: string; data_status: string | null }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function normalizeSession(raw: string | null | undefined, existing: string[]): string {
  const s = (raw ?? '').trim()
  let norm = 'Default'
  if (s && !/^(default|main|regular|single|annual|none|n\/a)$/i.test(s)) {
    const num = /(?:session|phase|attempt|cycle|round|stage|term)\s*-?\s*([ivx]+|\d+)/i.exec(s) ?? /^([ivx]+|\d+)$/i.exec(s)
    const month = MONTHS.find((m) => new RegExp(`\\b${m.slice(0, 3)}`, 'i').test(s))
    if (num) {
      const roman: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4' }
      norm = `Session ${roman[num[1].toLowerCase()] ?? num[1]}`
    } else if (month) {
      // Month-named sittings (CA: January/May/September) keep the month, unless the
      // exam already stores numbered sessions (JEE Main: January = Session 1, April = Session 2)
      const numbered = existing.some((e) => /^Session \d$/.test(e))
      norm = numbered && month === 'January' ? 'Session 1' : numbered && month === 'April' ? 'Session 2' : month
    } else norm = s.replace(/\b(19|20)\d{2}\b/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Default'
  }
  return existing.find((e) => e.toLowerCase() === norm.toLowerCase()) ?? norm
}

/**
 * "JEE Main" → strong: "JEE (Main)", "JEE-Main"; weak: the acronym "JEE"
 * (NTA titles the 2027 notice "Joint Entrance Examination (JEE)-2027").
 */
export function examNamePattern(name: string): LinkFocus {
  const words = name.replace(/\(.*?\)/g, ' ').split(/[^A-Za-z0-9]+/).filter(Boolean)
  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const strong = new RegExp(`\\b${words.map(esc).join('[\\s\\W]*')}\\b`, 'i')
  const acronym = words.length > 1 && /^[A-Z]{3,}$/.test(words[0]) ? words[0] : null
  return { strong, weak: acronym ? new RegExp(`\\b${esc(acronym)}\\b`) : undefined }
}

/** The exam's official host when no other exam uses it (cuet.nta.nic.in, not nta.ac.in or upsc.gov.in). */
export function soleHost(officialUrl: string | null | undefined, allOfficialUrls: (string | null)[]): string | undefined {
  const h = officialUrl ? hostOf(officialUrl) : ''
  if (!h) return undefined
  return allOfficialUrls.filter((u) => u && hostOf(u) === h).length === 1 ? h : undefined
}

let officialUrls: Promise<(string | null)[]> | null = null
/** examNamePattern, plus the exam's own site when it has one to itself. */
export async function examFocus(db: SupabaseClient, exam: { name: string; official_url: string | null }): Promise<LinkFocus> {
  officialUrls ??= Promise.resolve(db.from('exams').select('official_url')).then(({ data }) => (data ?? []).map((r) => r.official_url as string | null))
  return { ...examNamePattern(exam.name), ownHost: soleHost(exam.official_url, await officialUrls) }
}

export type ExamResult ={ slug: string; outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[] }

export async function updateExam(
  db: SupabaseClient,
  exam: ExamRow,
  opts: { runId: string | null; dryRun: boolean; force: boolean; today?: Date }
): Promise<ExamResult> {
  const today = opts.today ?? new Date()
  const result: ExamResult = { slug: exam.slug, outcomes: [], errors: [], dropped: [] }
  const ownUrls = [exam.official_url, ...(exam.source_urls ?? [])].filter(Boolean) as string[]
  if (!ownUrls.length) return { ...result, skipped: 'no official_url' }

  const gathered = await gatherPages(db, ownUrls, 3, undefined, await examFocus(db, exam))
  result.errors.push(...gathered.errors)
  if (!gathered.pages.length) return { ...result, skipped: 'could not fetch any official page' }
  if (!gathered.changed && !opts.force) {
    await db.from('exams').update({ last_checked_at: today.toISOString() }).eq('id', exam.id)
    return { ...result, skipped: 'official pages unchanged since last run' }
  }

  const Y = today.getFullYear()
  const task = `Exam: "${exam.name}". Today is ${today.toISOString().slice(0, 10)}.
Report the schedule of this exam for exam cycles held in ${Y} or ${Y + 1} only (the "year" is the calendar year in which the exam itself is written). Ignore older cycles and ignore other exams mentioned on the page.
If the exam is held more than once a year (e.g. JEE Main Session 1 and Session 2, CA exams in January/May/September, NDA I and II, UGC NET June and December), return EVERY session stated in the text as its own cycle, with its name exactly as the text calls it in "session" (e.g. "Session 2", "May"). If it is held once a year, session = null.
registration_start / registration_end = the window to APPLY FOR THE EXAM ITSELF. Never use counselling, choice-filling, seat allotment, admission, document-upload or correction windows, which happen after the exam.
registration_end = the regular last date to apply WITHOUT late fee. Only if the body officially EXTENDED that deadline, use the extended date. Ignore late-fee and correction windows.
exam_date_start / exam_date_end = first and last day of the written exam (same value if one day). For multi-stage exams use the first stage (e.g. Prelims).
Set "tentative": true if the text calls the dates tentative/expected.
JSON shape: {"cycles":[{"year":2027,"session":null,"tentative":false,"registration_start":{"value":"YYYY-MM-DD","quote":"..."},"registration_end":{...},"exam_date_start":{...},"exam_date_end":{...},"result_date":{...}}]}
Use null for any field the text does not state.`

  const ai = await extractJson(task, buildContext(gathered.pages, KEYWORDS), Output)
  if (!opts.dryRun) await saveCache(db, gathered.pages)
  await db.from('exams').update({ last_checked_at: today.toISOString() }).eq('id', exam.id)
  if (!ai) return { ...result, skipped: 'AI could not read the page' }

  const { data: existingRows } = await db
    .from('exam_schedules')
    .select('id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, data_status')
    .eq('exam_id', exam.id)
  const rows = (existingRows ?? []) as ScheduleRow[]
  const normCache = new Map<string, string>()

  for (const cycle of ai.cycles) {
    // A cycle is the year the exam is written: GATE 2027 opens in Sep 2026 but is held in Feb 2027.
    // A confirmed exam date settles it, whatever year the AI called the cycle.
    const examDate = cycle.exam_date_start
    if (examDate?.value && /^\d{4}-\d{2}-\d{2}$/.test(examDate.value) && locateQuote(examDate.quote, gathered.pages, normCache) && quoteSupportsDate(examDate.value, examDate.quote!)) {
      cycle.year = Number(examDate.value.slice(0, 4))
    }
    if (cycle.year < Y || cycle.year > Y + 1) continue
    const session = normalizeSession(cycle.session, rows.filter((r) => r.year === cycle.year).map((r) => r.session))
    const label = `${exam.name} ${cycle.year}${session === 'Default' ? '' : ` · ${session}`}`

    // Keep only facts whose quote is on an official page and contains the date
    const confirmed: Partial<Record<Field, { value: string; quote: string; url: string }>> = {}
    let tentative = !!cycle.tentative
    for (const f of FIELDS) {
      const fact = cycle[f]
      if (!fact?.value) continue
      const url = locateQuote(fact.quote, gathered.pages, normCache)
      if (!url) { result.dropped.push(`${label} ${f}: quote not found on page`); continue }
      if (!isOfficialUrl(url, ownUrls)) { result.dropped.push(`${label} ${f}: quote from non-official page`); continue }
      if (!quoteSupportsDate(fact.value, fact.quote!)) { result.dropped.push(`${label} ${f}: quote does not contain ${fact.value}`); continue }
      confirmed[f] = { value: fact.value, quote: fact.quote!, url }
      if (isTentative(fact.quote!)) tentative = true
    }
    if (!Object.keys(confirmed).length) continue

    const existing = rows.find((r) => r.year === cycle.year && r.session === session) ?? null
    const merged: ScheduleDates = {}
    for (const f of FIELDS) merged[f] = confirmed[f]?.value ?? existing?.[f] ?? null

    const fields: Record<string, Change> = {}
    for (const f of FIELDS) {
      const c = confirmed[f]
      if (c && c.value !== (existing?.[f] ?? null)) fields[f] = { old: existing?.[f] ?? null, new: c.value, evidence: c.quote }
    }

    // The official notice now speaks for this row: hand-typed guesses it does not
    // confirm (e.g. a made-up result date) are cleared to "Not announced".
    if (existing && (existing.data_status ?? 'unverified') === 'unverified') {
      for (const f of FIELDS) {
        if (existing[f] && !confirmed[f]) {
          fields[f] = { old: existing[f], new: null, evidence: null }
          merged[f] = null
        }
      }
    }

    let issues = validateSchedule(cycle.year, merged, today)

    // Legacy values the official page did not confirm, which make the row
    // impossible (e.g. result before exam) → propose clearing them.
    if (issues.length && existing) {
      const legacy = FIELDS.filter((f) => existing[f] && !confirmed[f])
      const without = (drop: Field[]) => {
        const c: ScheduleDates = { ...merged }
        for (const f of drop) c[f] = null
        return c
      }
      // Smallest fix first: one field, then all unconfirmed fields
      const single = legacy.find((f) => validateSchedule(cycle.year, without([f]), today).length === 0)
      const drop = single ? [single] : validateSchedule(cycle.year, without(legacy), today).length === 0 ? legacy : []
      if (drop.length) {
        for (const f of drop) fields[f] = { old: existing[f], new: null, evidence: null }
        Object.assign(merged, without(drop))
        issues = [`Unconfirmed old value(s) conflict with official dates: ${drop.join(', ')}`]
      }
    }

    const allConfirmed = FIELDS.every((f) => !merged[f] || confirmed[f])
    const status = allConfirmed ? (tentative ? 'tentative' : 'verified') : (existing?.data_status ?? 'unverified')
    const sourceUrl = Object.values(confirmed)[0]!.url
    const extra = { source_url: sourceUrl, verified_at: today.toISOString(), data_status: status }

    if (!Object.keys(fields).length) {
      // Nothing new — just record that the row was re-confirmed
      if (existing && !opts.dryRun) await db.from('exam_schedules').update(extra).eq('id', existing.id)
      continue
    }
    const overwritesVerified =
      existing?.data_status === 'verified' && Object.values(fields).some((c) => c.old !== null)

    result.outcomes.push(
      await submitProposal(
        db,
        opts.runId,
        {
          entity: 'exam_schedule',
          table: 'exam_schedules',
          recordId: existing?.id ?? null,
          parentId: exam.id,
          label,
          fields,
          insertKey: existing ? undefined : { exam_id: exam.id, year: cycle.year, session },
          extra,
          sourceUrl,
          official: true,
          overwritesVerified,
          forceReview: issues.length ? `Failed sanity checks: ${issues.join('; ')}` : undefined,
        },
        opts.dryRun
      )
    )
  }
  return result
}
