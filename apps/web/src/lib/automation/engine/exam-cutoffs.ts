/**
 * Official exam cutoffs (qualifying marks / percentiles / NTA scores per
 * category) from the conducting body's result notices and press releases.
 * Every value must be quoted from an official page together with its
 * category. A year with official rows replaces that year's old hand-typed
 * rows (retire_replaced_unverified).
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { amountsIn, normalize } from './evidence'
import { fetchPage, focusText, relevantLinks } from './http'
import { gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { examFocus, type ExamRow } from './exams'

const CUTOFF = /(cut[\s-]?off|qualifying|press release|result|percentile|merit list|minimum marks)/i
const CUTOFF_TEXT = /(cut[\s-]?off|qualifying (marks|percentile|score)|minimum qualifying|qualified for)/i
const KEYWORDS = /(cut[\s-]?off|qualif|percentile|marks|score|general|unreserved|\bur\b|obc|\bsc\b|\bst\b|ews|pwd|ph\b|category)/i
/** Rows this reader writes carry this note; anything else official was entered by hand. */
const READER_NOTE = /^Official: /

const Output = z.object({
  rows: z
    .array(
      z.object({
        year: z.coerce.number().int(),
        stage: z.string().nullish(),
        category: z.string(),
        cutoff_type: z.string().nullish(),
        metric: z.string().nullish(),
        value: z.coerce.number(),
        value_to: z.coerce.number().nullish(),
        max_score: z.coerce.number().nullish(),
        quote: z.string().nullish(),
      })
    )
    .default([]),
})

/** Category names as notices write them: "UR", "General", "GEN-EWS", "OBC-NCL", "PwBD" … */
const CATEGORY_WORDS: [RegExp, string][] = [
  [/\b(gen(eral)?[\s-]*ews|ews)\b/i, 'EWS'],
  [/\bobc(\s*-?\s*ncl)?\b/i, 'OBC-NCL'],
  [/\bsc\b|scheduled caste/i, 'SC'],
  [/\bst\b|scheduled tribe/i, 'ST'],
  [/\b(pwd|pwbd|ph|divyang)/i, 'PwD'],
  [/\b(ur|gen(eral)?|unreserved|open|common rank)\b/i, 'General/UR'],
]

/** The quote must name the category the value is reported for. */
export function quoteNamesCategory(category: string, quote: string): boolean {
  const want = CATEGORY_WORDS.find(([re]) => re.test(category))
  if (!want) return normalize(quote).includes(normalize(category))
  return want[0].test(quote)
}

/** Lines that pair a category with a number: a cutoff table, not a homepage that mentions "cut-off". */
export function cutoffLines(text: string): number {
  const score = /\b(?!(19|20)\d\d\b)\d+(\.\d+)?\b/ // a number that is not a year
  return text.split('\n').filter((l) => score.test(l) && CATEGORY_WORDS.some(([re]) => re.test(l))).length
}

export type ExamCutoffResult = { slug: string; outcomes: never[]; skipped?: string; errors: string[]; dropped: string[]; log: string[] }

export async function updateExamCutoffs(
  db: SupabaseClient,
  exam: ExamRow & { cutoffs_read_at?: string | null },
  opts: { dryRun: boolean; force: boolean; today?: Date }
): Promise<ExamCutoffResult> {
  const today = opts.today ?? new Date()
  const res: ExamCutoffResult = { slug: exam.slug, outcomes: [], errors: [], dropped: [], log: [] }
  const ownUrls = [exam.official_url, ...(exam.source_urls ?? [])].filter(Boolean) as string[]
  if (!ownUrls.length) return { ...res, skipped: 'no official_url' }

  const focus = await examFocus(db, exam)
  const gathered = await gatherPages(db, ownUrls, 4, CUTOFF, focus)
  res.errors.push(...gathered.errors)
  // Result pages link the press release / cutoff PDF
  const seen = new Set(gathered.pages.map((p) => p.url))
  for (const p of gathered.pages.filter((p) => p.kind === 'html' && CUTOFF.test(p.url))) {
    for (const url of relevantLinks(p, 2, CUTOFF, focus)) {
      if (seen.has(url) || gathered.pages.length >= 8) continue
      seen.add(url)
      try { gathered.pages.push(await fetchPage(url)) } catch (err) { res.errors.push((err as Error).message) }
    }
  }
  // Not a homepage: its notice titles mention cut-offs and categories without holding any cutoff
  const isHome = (url: string) => new URL(url).pathname.replace(/\/(index\.\w+)?$/, '') === ''
  const pages = gathered.pages.filter((p) => !isHome(p.finalUrl) && isOfficialUrl(p.finalUrl, ownUrls) && CUTOFF_TEXT.test(p.text) && cutoffLines(p.text) >= 3)
  if (!pages.length) return { ...res, skipped: 'no official cutoff notice found on the official site' }
  // The exam-date check caches the same pages, so "unchanged" only counts once this reader has read them
  if (!gathered.changed && exam.cutoffs_read_at && !opts.force) return { ...res, skipped: 'official pages unchanged since last run' }

  const Y = today.getFullYear()
  const per = Math.floor(12_000 / Math.min(pages.length, 4))
  const context = pages.slice(0, 4).map((p, i) => `### SOURCE ${i + 1}: ${p.finalUrl}\n${focusText(p.text, KEYWORDS, per)}`).join('\n\n')
  const task = `Exam: "${exam.name}". Today is ${today.toISOString().slice(0, 10)}.
Report the OFFICIAL CUTOFFS of this exam stated in the text for the years ${Y - 4} to ${Y}: the minimum marks / percentile / score per category that candidates needed.
For each value: year (the year the exam was held), stage (e.g. "Prelims"; null if single-stage), category exactly as written (e.g. "UR", "OBC-NCL", "EWS", "SC", "ST", "PwD"), cutoff_type = what the cutoff is for, in a few words as the text says (e.g. "Qualifying for JEE (Advanced)", "Qualifying percentile", "Final selection"), metric = "marks", "percentile" or "NTA score", value = the number exactly as written (value_to if the text gives a range), max_score = total marks if stated.
quote = the text containing BOTH the category and the number, copied exactly (for a table, the table row).
Do not report toppers' scores, ranks of individual candidates, or cutoffs of other exams. If no cutoff is stated, return {"rows":[]}.
JSON: {"rows":[{"year":${Y},"stage":null,"category":"UR","cutoff_type":"…","metric":"percentile","value":93.1023262,"value_to":null,"max_score":null,"quote":"…"}]}`

  if (process.env.AUTOMATION_DEBUG) console.log(`    📄 ${pages.map((p) => p.finalUrl).join(', ')}`)
  const ai = await extractJson(task, context, Output)
  // Cached only after a successful read, so a failed read is retried next time
  if (!ai) return { ...res, skipped: 'AI could not read the cutoff notice' }
  if (!opts.dryRun) {
    await saveCache(db, gathered.pages)
    await db.from('exams').update({ cutoffs_read_at: today.toISOString() }).eq('id', exam.id)
  }

  const normCache = new Map<string, string>()
  const byYear = new Map<number, Record<string, unknown>[]>()
  for (const r of ai.rows) {
    const label = `${exam.slug} ${r.year} ${r.category}`
    if (r.year < Y - 4 || r.year > Y) continue
    const url = locateQuote(r.quote, pages, normCache)
    if (!url) { res.dropped.push(`${label}: quote not on an official page`); continue }
    if (!amountsIn(r.quote!).includes(r.value)) { res.dropped.push(`${label}: quote does not contain ${r.value}`); continue }
    if (!quoteNamesCategory(r.category, r.quote!)) { res.dropped.push(`${label}: quote does not name the category`); continue }
    // The year must be in the quote or in the notice's own heading
    const page = pages.find((p) => p.finalUrl === url)!
    const heading = `${page.finalUrl} ${page.text.slice(0, 1500)}`
    const yearsInHeading = new Set([...heading.matchAll(/\b(20\d\d)\b/g)].map((m) => Number(m[1])).filter((y) => y >= Y - 5 && y <= Y + 1))
    const dated = r.quote!.includes(String(r.year)) || (yearsInHeading.size === 1 && yearsInHeading.has(r.year))
    if (!dated) { res.dropped.push(`${label}: year not stated next to the value`); continue }
    if (r.metric === 'percentile' && (r.value < 0 || r.value > 100)) { res.dropped.push(`${label}: percentile out of range`); continue }

    const list = byYear.get(r.year) ?? []
    list.push({
      exam_id: exam.id, year: r.year, stage: r.stage ?? null, category: r.category.trim().slice(0, 60),
      cutoff_type: r.cutoff_type?.slice(0, 120) ?? null, cutoff_metric: r.metric ?? null,
      cutoff_score: r.value, cutoff_score_to: r.value_to ?? null, max_score: r.max_score ?? null,
      source_url: url, source_type: 'official', verified_at: today.toISOString(),
      notes: `Official: ${r.quote!.replace(/\s+/g, ' ').slice(0, 200)}`,
    })
    byYear.set(r.year, list)
  }

  for (const [year, rows] of byYear) {
    // Same exam/year/category/stage/type reported twice → keep the first
    let unique = [...new Map(rows.map((r) => [`${r.stage}|${r.category}|${r.cutoff_type}`, r])).values()]
    // Official rows entered by hand (checked against the notice, often per programme or post)
    // are never replaced by this reader; it only adds what they do not already cover.
    const { data: existing } = await db
      .from('exam_national_cutoffs')
      .select('stage, category, notes')
      .eq('exam_id', exam.id).eq('year', year).eq('source_type', 'official')
    const manual = (existing ?? []).filter((r) => !READER_NOTE.test(r.notes ?? ''))
    if (manual.length) {
      const key = (stage: unknown, category: unknown) => `${normalize(String(stage ?? ''))}|${normalize(String(category ?? ''))}`
      const covered = new Set(manual.map((r) => key(r.stage, r.category)))
      unique = unique.filter((r) => !covered.has(key(r.stage, r.category)))
    }
    res.log.push(`${exam.slug} ${year}: ${unique.length} official cutoffs${manual.length ? ` (kept ${manual.length} entered by hand)` : ''}`)
    if (opts.dryRun || (!unique.length && manual.length)) continue
    // Replace only what this reader wrote before
    await db.from('exam_national_cutoffs').delete().eq('exam_id', exam.id).eq('year', year).eq('source_type', 'official').like('notes', 'Official: %')
    if (!unique.length) continue
    const { error } = await db.from('exam_national_cutoffs').insert(unique)
    if (error) res.errors.push(`${exam.slug} ${year}: ${error.message}`)
  }
  if (!byYear.size) res.log.push(`${exam.slug}: no cutoff confirmed on the official pages`)
  return res
}
