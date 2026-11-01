/**
 * Career facts from the official body that regulates or recruits for the
 * career: who is eligible, how to get in, the licence needed, and the pay
 * it publishes (government and defence roles). Every item shown to students
 * is a sentence copied from the official page, so nothing is paraphrased.
 *
 * Salary ranges, growth and demand for private careers are not read: no
 * official body publishes them.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { amountsIn, normalize } from './evidence'
import { gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { examNamePattern } from './exams'
import type { FetchedPage } from './http'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'

const LINKS = /(eligib|qualif|admission|how to (join|apply|become)|course|programme|licen[cs]e|registration|pay|salary|stipend|recruit|entry|certification|career|overview)/i
const KEYWORDS = /(eligib|qualif|age|years|degree|class|10\+2|graduat|pass|marks|percent|licen[cs]e|regist|certif|exam|test|training|course|pay|salary|stipend|₹|rs\.?|per month|allowance|medical|fitness|selection|interview|apply|admission)/i

const Quote = z.object({ quote: z.string().nullish() })
const orEmpty = <T,>(v: T[] | null | undefined): T[] => v ?? []
const Output = z.object({
  eligibility: z.array(Quote).nullish().transform(orEmpty),
  steps: z.array(Quote).nullish().transform(orEmpty),
  licence: Quote.nullish(),
  pay: z.object({ min: z.coerce.number().nullish(), max: z.coerce.number().nullish(), quote: z.string().nullish() }).nullish(),
})

export type CareerRow = {
  id: string
  title: string
  slug: string
  official_body: string | null
  official_url: string | null
  source_urls: string[] | null
  eligibility: unknown
  how_to_enter: unknown
  licence: string | null
  official_pay: string | null
  official_pay_min: number | null
  official_pay_max: number | null
  verified_at: string | null
  facts_read_at?: string | null
}

type Item = { text: string; source_url: string }

/**
 * The part of each page that talks about the career: full sentences (menus and
 * link lists are short lines) that mention the career or an entry requirement,
 * pages naming the career first.
 */
export function careerContext(pages: FetchedPage[], title: RegExp, budget = 14_000): string {
  // Menus and notice tickers repeat on every page of a site; the page's own content does not
  const seenOn = new Map<string, number>()
  for (const p of pages) for (const l of new Set(p.text.split('\n').map((x) => x.trim()))) seenOn.set(l, (seenOn.get(l) ?? 0) + 1)
  const boilerplate = (l: string) => pages.length > 1 && (seenOn.get(l) ?? 0) > 1
  const scored = pages.map((p) => {
    const lines = p.text.split('\n').map((l) => l.trim()).filter((l) => l.length >= 40 && !boilerplate(l) && (title.test(l) || KEYWORDS.test(l)))
    return { p, lines, hits: lines.filter((l) => title.test(l)).length }
  }).filter((x) => x.lines.length).sort((a, b) => b.hits - a.hits)
  const per = Math.max(2500, Math.floor(budget / Math.max(1, scored.length)))
  return scored.map(({ p, lines }) => `### SOURCE: ${p.finalUrl}\n${lines.join('\n').slice(0, per)}`).join('\n\n').slice(0, budget)
}

const clean = (q: string) => q.replace(/\s+/g, ' ').trim().replace(/^[•\-–*·\d.)\s]+/, '')

/** A sentence about the career, not a menu, a date notice or a heading. */
export function usableSentence(q: string): boolean {
  const t = clean(q)
  if (t.length < 25 || t.length > 400 || !/[a-z]{3,}\s+[a-z]{3,}/i.test(t)) return false
  if (/(click here|read more|last date|apply online now|login|download)/i.test(t)) return false
  // A PDF table cell or a wrapped line cut mid-sentence: ends on a connective, ends mid-list
  // ("Qualification from a recognized Board, or university"), or has a bracket from the next cell
  if (/(\b(or|and|from|of|the|to|in|be|should|with|for|a|an|as|by|on|at|which|who|than|not)|[,(:;–-])\s*$/i.test(t)) return false
  if (/,\s*or\s+\w+$/i.test(t) || (t.match(/\(/g) ?? []).length !== (t.match(/\)/g) ?? []).length) return false
  // Rules for people already in the career, not for getting in
  if (/\b(renewal|revalidation)\b/i.test(t)) return false
  // A wrapped line that starts mid-sentence ("years as on 01/01/2026 …"), unless it is an instruction ("pass the NISM exam")
  const opensMidSentence = /^[a-z]/.test(t) && !/^(pass|register|obtain|complete|apply|qualify|clear|hold|possess|have)\b/.test(t)
  // Eligibility rules are often verbless ("Bachelor's Degree in any discipline"); dates and fees are not rules
  const scheduleOrFee = /^(online|dates?|start date|application fee|payment|stage-?\d|conduct of)\b/i.test(t)
  return !opensMidSentence && !scheduleOrFee
}

export async function updateCareer(
  db: SupabaseClient,
  c: CareerRow,
  opts: { runId: string | null; dryRun: boolean; force: boolean; today?: Date }
): Promise<{ slug: string; outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[] }> {
  const today = opts.today ?? new Date()
  const res = { slug: c.slug, outcomes: [] as ProposalOutcome[], errors: [] as string[], dropped: [] as string[] }
  const own = [c.official_url, ...(c.source_urls ?? [])].filter(Boolean) as string[]
  if (!own.length) return { ...res, skipped: 'no official_url' }

  // Follow only links that name this career ("Research Analyst"), not every notice on the site
  const focus = examNamePattern(c.title.replace(/\(.*?\)/g, ' ').trim())
  const gathered = await gatherPages(db, own, 4, LINKS, focus)
  res.errors.push(...gathered.errors)
  const pages = gathered.pages.filter((p) => isOfficialUrl(p.finalUrl, own) && p.text.length > 200)
  if (!pages.length) return { ...res, skipped: 'could not read any official page (blocked, or shown only with JavaScript)' }
  // Other checks may cache the same pages, so "unchanged" only counts once this reader has read them
  if (!gathered.changed && c.facts_read_at && !opts.force) return { ...res, skipped: 'official pages unchanged since last run' }

  const task = `Career: "${c.title}"${c.official_body ? ` (official body: ${c.official_body})` : ''}. The text is from that body's official website.
Copy, word for word, the sentences that tell a student how to enter this career:
- eligibility: who can apply or join (education, subjects, marks, age, nationality, medical fitness). One quote per rule.
- steps: the route in, in order (course or training to complete, exam or selection process, registration). One quote per step.
- licence: the licence, registration or certificate required to practise, if the text states one.
- pay: the pay, stipend or salary the text states for this role, with min/max in rupees per month as written (null if the text gives none).
Only quote text about entering "${c.title}" itself; ignore other courses, careers and notices, and ignore renewal, recertification and continuing-education rules for people already in the career. Each quote must be copied exactly (8-300 characters). Use [] or null when the text does not say.
JSON: {"eligibility":[{"quote":"…"}],"steps":[{"quote":"…"}],"licence":{"quote":"…"},"pay":{"min":30000,"max":40000,"quote":"…"}}`

  const context = careerContext(pages, focus.strong)
  if (process.env.AUTOMATION_DEBUG) console.log(`    📄 ${pages.map((p) => p.finalUrl).join(', ')}
${context.slice(0, 2000)}`)
  const ai = await extractJson(task, context, Output)
  // Cached only after a successful read, so a failed read is retried next time
  if (!ai) return { ...res, skipped: 'AI could not read the official pages' }
  if (!opts.dryRun) {
    await saveCache(db, gathered.pages)
    await db.from('careers').update({ facts_read_at: today.toISOString() }).eq('id', c.id)
  }

  const norm = new Map<string, string>()
  const confirm = (quote: string | null | undefined, what: string): Item | null => {
    if (!quote) return null
    const url = locateQuote(quote, pages, norm)
    if (!url) { res.dropped.push(`${c.title} ${what}: quote not on the official page`); return null }
    if (!usableSentence(quote)) { res.dropped.push(`${c.title} ${what}: not a usable sentence`); return null }
    return { text: clean(quote), source_url: url }
  }
  const unique = (items: (Item | null)[]) => [...new Map(items.filter((i): i is Item => !!i).map((i) => [normalize(i.text), i])).values()].slice(0, 8)

  const eligibility = unique(ai.eligibility.map((e) => confirm(e.quote, 'eligibility')))
  const steps = unique(ai.steps.map((s) => confirm(s.quote, 'step')))
  const licence = confirm(ai.licence?.quote, 'licence')
  let pay: (Item & { min: number | null; max: number | null }) | null = null
  const payItem = confirm(ai.pay?.quote, 'pay')
  if (payItem) {
    const amounts = amountsIn(payItem.text)
    const min = ai.pay?.min != null && amounts.includes(ai.pay.min) ? ai.pay.min : null
    const max = ai.pay?.max != null && amounts.includes(ai.pay.max) ? ai.pay.max : null
    if (min == null && max == null) res.dropped.push(`${c.title} pay: amount not in the quote`)
    else pay = { ...payItem, min, max }
  }

  const fields: Record<string, Change> = {}
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
  const set = (k: string, oldV: unknown, newV: unknown, evidence: string | null) => {
    if (!same(oldV, newV)) fields[k] = { old: oldV ?? null, new: newV, evidence }
  }
  if (eligibility.length) set('eligibility', c.eligibility, eligibility, eligibility[0].text)
  if (steps.length) set('how_to_enter', c.how_to_enter, steps, steps[0].text)
  if (licence) set('licence', c.licence, licence.text, licence.text)
  if (pay) {
    set('official_pay', c.official_pay, pay.text, pay.text)
    set('official_pay_min', c.official_pay_min, pay.min, pay.text)
    set('official_pay_max', c.official_pay_max, pay.max, pay.text)
  }
  const first = eligibility[0] ?? steps[0] ?? licence ?? pay
  if (!first) return { ...res, skipped: 'nothing about this career confirmed on the official pages' }
  if (!Object.keys(fields).length) {
    if (!opts.dryRun) await db.from('careers').update({ verified_at: today.toISOString() }).eq('id', c.id)
    return res
  }

  res.outcomes.push(
    await submitProposal(
      db,
      opts.runId,
      {
        entity: 'career',
        table: 'careers',
        recordId: c.id,
        label: `${c.title} — how to enter, from ${c.official_body ?? 'the official body'}`,
        fields,
        extra: { facts_source_url: first.source_url, verified_at: today.toISOString() },
        sourceUrl: first.source_url,
        official: true,
        overwritesVerified: !!c.verified_at && Object.values(fields).some((f) => f.old !== null && !(Array.isArray(f.old) && !f.old.length)),
      },
      opts.dryRun
    )
  )
  return res
}
