/**
 * Exam pattern (duration, number of questions, total marks, marks per correct
 * answer, negative marking) and eligibility (minimum percentage, age limits)
 * from the exam's current official notification / information bulletin.
 *
 * The AI only reads: each number must be in a quote that is on an official
 * page of this cycle. An empty field is filled automatically; a change to a
 * value already on file waits for the admin in Automation → Needs review.
 * New stages are never created and sections are left as they are.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { amountsIn, normalize } from './evidence'
import { fetchPage, relevantLinks } from './http'
import { buildContext, gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { examFocus, type ExamRow } from './exams'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'

const LINKS = /(pattern|scheme|information.?bulletin|brochure|prospectus|notification|notice|eligib|marking|syllabus|instructions)/i
const KEYWORDS = /(duration|hour|minute|question|marks?|negative|deduct|correct|incorrect|wrong|eligib|age|years|percentage|%|aggregate|class|qualif|section|paper|part)/i

const Val = z.object({ value: z.coerce.number().nullish(), quote: z.string().nullish() }).nullish()
const Output = z.object({
  stages: z
    .array(z.object({
      stage: z.string().nullish(),
      duration_minutes: Val,
      total_questions: Val,
      total_marks: Val,
      marks_per_correct: Val,
      negative_marking: Val,
    }))
    .nullish()
    .transform((v) => v ?? []),
  eligibility: z.object({ min_percentage: Val, age_min: Val, age_max: Val }).nullish(),
})

type PatternRow = { id: string; stage: string | null; duration_minutes: number | null; total_questions: number | null; total_marks: number | null; marks_per_correct: number | string | null; negative_marking: number | string | null }
type EligRow = { id: string; min_percentage: number | null; age_min: number | null; age_max: number | null }

const WORD_FRACTIONS: [RegExp, number][] = [[/one.?third/i, 1 / 3], [/one.?fourth|one.?quarter|a quarter/i, 0.25], [/one.?half|half/i, 0.5], [/two.?thirds?/i, 2 / 3]]

/** Does the quote state this number (also as hours for a duration, or as a fraction such as 1/3)? */
export function quoteStates(value: number, quote: string, kind: 'duration' | 'fraction' | 'plain'): boolean {
  const nums = amountsIn(quote)
  const near = (a: number, b: number) => Math.abs(a - b) < 0.011
  if (nums.some((n) => near(n, value))) return true
  if (kind === 'duration' && /hour|hrs?\b/i.test(quote) && nums.some((n) => near(n * 60, value))) return true
  if (kind === 'fraction') {
    if (value === 0 && /no negative|not.{0,20}negative|without negative|zero/i.test(quote)) return true
    for (const m of quote.matchAll(/(\d+)\s*\/\s*(\d+)/g)) if (near(Number(m[1]) / Number(m[2]), value)) return true
    if (WORD_FRACTIONS.some(([re, f]) => re.test(quote) && near(f, value))) return true
  }
  return false
}

const num = (v: number | string | null | undefined) => (v == null ? null : Number(v))

export type ExamRulesResult = { slug: string; outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[]; log: string[] }

export async function updateExamRules(
  db: SupabaseClient,
  exam: ExamRow & { rules_read_at?: string | null },
  opts: { runId: string | null; dryRun: boolean; force: boolean; today?: Date }
): Promise<ExamRulesResult> {
  const today = opts.today ?? new Date()
  const Y = today.getFullYear()
  const res: ExamRulesResult = { slug: exam.slug, outcomes: [], errors: [], dropped: [], log: [] }
  const ownUrls = [exam.official_url, ...(exam.source_urls ?? [])].filter(Boolean) as string[]
  if (!ownUrls.length) return { ...res, skipped: 'no official_url' }

  const { data: patternData } = await db.from('exam_pattern')
    .select('id, stage, duration_minutes, total_questions, total_marks, marks_per_correct, negative_marking').eq('exam_id', exam.id).order('stage_order')
  const patterns = (patternData ?? []) as PatternRow[]
  const { data: eligData } = await db.from('exam_eligibility').select('id, min_percentage, age_min, age_max').eq('exam_id', exam.id).limit(1)
  const elig = ((eligData ?? [])[0] ?? null) as EligRow | null
  if (!patterns.length && !elig) return { ...res, skipped: 'no pattern or eligibility on file to check' }

  const focus = await examFocus(db, exam)
  const gathered = await gatherPages(db, ownUrls, 4, LINKS, focus)
  res.errors.push(...gathered.errors)
  // The bulletin / notification PDFs those pages list
  const seen = new Set(gathered.pages.map((p) => p.url))
  for (const p of gathered.pages.filter((p) => p.kind === 'html')) {
    for (const url of relevantLinks(p, 2, LINKS, focus)) {
      if (seen.has(url) || gathered.pages.length >= 9) continue
      seen.add(url)
      try { gathered.pages.push(await fetchPage(url)) } catch (err) { res.errors.push((err as Error).message) }
    }
  }
  // This cycle's documents only: the page must name this year or next
  const current = (t: string) => new RegExp(`\\b(${Y}|${Y + 1})\\b`).test(t)
  const pages = gathered.pages.filter((p) => isOfficialUrl(p.finalUrl, ownUrls) && KEYWORDS.test(p.text) && current(`${p.finalUrl} ${p.text.slice(0, 4000)}`)
    && /(duration|marking|negative|eligib|age limit|total marks|number of questions)/i.test(p.text))
  if (!pages.length) return { ...res, skipped: `no ${Y}/${Y + 1} official notice with the pattern or eligibility found` }
  if (!gathered.changed && exam.rules_read_at && !opts.force) return { ...res, skipped: 'official pages unchanged since last run' }

  const stageNames = patterns.map((p) => p.stage).filter(Boolean)
  const task = `Exam: "${exam.name}". Today is ${today.toISOString().slice(0, 10)}.
From the official text, report the exam pattern${stageNames.length ? ` for each of its stages (${stageNames.join(', ')})` : ''} and the eligibility.
For each stage: stage (name as above; null for a single-stage exam), duration_minutes (total time in minutes), total_questions, total_marks, marks_per_correct (marks for each correct answer, only if the same for every question), negative_marking (marks deducted per wrong answer as a positive number, 0 if the text says there is no negative marking, null if not stated).
Eligibility: min_percentage (minimum aggregate % in the qualifying exam for general category), age_min and age_max in years (only if stated as a number of years).
Each value needs a quote copied exactly from the text that contains the number (or the words, e.g. "one-third", "3 hours"). Use null when the text does not state it. Do not compute values the text does not state.
JSON: {"stages":[{"stage":null,"duration_minutes":{"value":180,"quote":"…"},"total_questions":{"value":90,"quote":"…"},"total_marks":{"value":300,"quote":"…"},"marks_per_correct":{"value":4,"quote":"…"},"negative_marking":{"value":1,"quote":"…"}}],"eligibility":{"min_percentage":{"value":75,"quote":"…"},"age_min":null,"age_max":null}}`

  const ai = await extractJson(task, buildContext(pages.slice(0, 5), KEYWORDS, 14_000), Output)
  if (!ai) return { ...res, skipped: 'AI could not read the notice' }
  if (!opts.dryRun) {
    await saveCache(db, gathered.pages)
    await db.from('exams').update({ rules_read_at: today.toISOString() }).eq('id', exam.id)
  }

  const norm = new Map<string, string>()
  const check = (v: z.infer<typeof Val>, kind: 'duration' | 'fraction' | 'plain', label: string): { value: number; url: string; quote: string } | null => {
    if (v?.value == null || !v.quote) return null
    const url = locateQuote(v.quote, pages, norm)
    if (!url) { res.dropped.push(`${label}: quote not on an official page`); return null }
    const value = Math.abs(v.value)
    if (!quoteStates(value, v.quote, kind)) { res.dropped.push(`${label}: quote does not state ${value}`); return null }
    return { value, url, quote: v.quote }
  }

  // Match each reading to a stage on file; new stages are never created
  const rowFor = (stage: string | null | undefined): PatternRow | null => {
    if (patterns.length === 1) return patterns[0]
    if (!stage) return null
    const s = normalize(stage)
    return patterns.find((p) => p.stage && (normalize(p.stage).includes(s) || s.includes(normalize(p.stage)) || (/prelim/.test(s) && /prelim/i.test(p.stage)) || (/main/.test(s) && /main/i.test(p.stage)))) ?? null
  }
  const FIELDS: [keyof PatternRow & string, 'duration' | 'fraction' | 'plain'][] = [
    ['duration_minutes', 'duration'], ['total_questions', 'plain'], ['total_marks', 'plain'], ['marks_per_correct', 'fraction'], ['negative_marking', 'fraction'],
  ]
  for (const st of ai.stages) {
    const row = rowFor(st.stage)
    if (!row) { if (st.stage) res.dropped.push(`${exam.slug} ${st.stage}: no such stage on file`); continue }
    const fields: Record<string, Change> = {}
    let source: string | null = null
    for (const [f, kind] of FIELDS) {
      const got = check(st[f as keyof typeof st] as z.infer<typeof Val>, kind, `${exam.slug} ${row.stage ?? ''} ${f}`)
      if (!got) continue
      const old = num(row[f] as number | string | null)
      if (old != null && Math.abs(Math.abs(old) - got.value) < 0.011) continue
      fields[f] = { old, new: got.value, evidence: got.quote }
      source ??= got.url
    }
    if (!source) continue
    res.log.push(`${exam.slug} ${row.stage ?? 'pattern'}: ${Object.keys(fields).join(', ')}`)
    res.outcomes.push(await submitProposal(db, opts.runId, {
      entity: 'exam', table: 'exam_pattern', recordId: row.id, parentId: exam.id,
      label: `${exam.name}${row.stage ? ` · ${row.stage}` : ''} — exam pattern`,
      fields, sourceUrl: source, official: true,
      // Filling a blank is automatic; changing a figure already on file waits for the admin
      overwritesVerified: Object.values(fields).some((c) => c.old != null),
    }, opts.dryRun))
  }

  if (ai.eligibility) {
    const fields: Record<string, Change> = {}
    let source: string | null = null
    for (const f of ['min_percentage', 'age_min', 'age_max'] as const) {
      const got = check(ai.eligibility[f], 'plain', `${exam.slug} eligibility ${f}`)
      if (!got) continue
      const old = elig ? num(elig[f]) : null
      if (old != null && Math.abs(old - got.value) < 0.011) continue
      fields[f] = { old, new: got.value, evidence: got.quote }
      source ??= got.url
    }
    if (source) {
      res.log.push(`${exam.slug} eligibility: ${Object.keys(fields).join(', ')}`)
      res.outcomes.push(await submitProposal(db, opts.runId, {
        entity: 'exam', table: 'exam_eligibility', recordId: elig?.id ?? null, parentId: exam.id,
        insertKey: elig ? undefined : { exam_id: exam.id },
        label: `${exam.name} — eligibility`,
        fields, sourceUrl: source, official: true,
        overwritesVerified: Object.values(fields).some((c) => c.old != null),
      }, opts.dryRun))
    }
  }
  if (!res.outcomes.length) res.log.push(`${exam.slug}: pattern and eligibility match the official notice (or nothing confirmed)`)
  return res
}
