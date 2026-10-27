/**
 * College facts from each college's own website: NAAC grade, year of
 * establishment and annual tuition fees. Same rules as exams: every value
 * needs a verbatim quote from the official site that contains it.
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { normalize, quoteSupportsNumber } from './evidence'
import { buildContext, gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'

const StrFact = z.object({ value: z.string().nullish(), quote: z.string().nullish() }).nullish()
const NumFact = z.object({ value: z.coerce.number().nullish(), quote: z.string().nullish() }).nullish()
const Output = z.object({
  naac_grade: StrFact,
  established_year: NumFact,
  annual_fees_min: NumFact,
  annual_fees_max: NumFact,
})

const KEYWORDS = /(naac|accredit|grade|cgpa|established|founded|since|set up|inception|fee|tuition|per annum|per year|annual|₹|rs\.?|inr)/i
const LINK_HINT = /(about|history|overview|profile|fee|fees|tuition|naac|iqac|accreditation|admission)/i
const GRADES = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D'] as const

export type CollegeRow = {
  id: string
  name: string
  website_url: string | null
  naac_grade: string | null
  established_year: number | null
  annual_fees_min: number | null
  annual_fees_max: number | null
  verified_at: string | null
}

/** "NAAC A++" / "accredited with A+ grade": the quote must name NAAC and that exact grade. */
export function quoteSupportsGrade(grade: string, quote: string): boolean {
  if (!/naac/i.test(quote)) return false
  const esc = grade.replace(/\+/g, '\\+')
  return new RegExp(`(^|[^A-Za-z+])${esc}(?![+A-Za-z])`).test(quote.replace(/\s+(?=\+)/g, ''))
}

export function quoteSupportsYear(year: number, quote: string): boolean {
  return new RegExp(`\\b${year}\\b`).test(quote) && /(establish|found|since|set up|inception|incorporat|started|came into being)/i.test(quote)
}

export async function updateCollege(
  db: SupabaseClient,
  c: CollegeRow,
  opts: { runId: string | null; dryRun: boolean; force: boolean; today?: Date }
): Promise<{ slug: string; outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[] }> {
  const today = opts.today ?? new Date()
  const res = { slug: c.name, outcomes: [] as ProposalOutcome[], errors: [] as string[], dropped: [] as string[] }
  if (!c.website_url) return { ...res, skipped: 'no website_url' }

  const gathered = await gatherPages(db, [c.website_url], 3, LINK_HINT)
  res.errors.push(...gathered.errors)
  if (!gathered.pages.length) return { ...res, skipped: 'could not fetch website' }
  if (!gathered.changed && !opts.force) {
    await db.from('colleges').update({ last_checked_at: today.toISOString() }).eq('id', c.id)
    return { ...res, skipped: 'website unchanged' }
  }

  const task = `College: "${c.name}". Only report facts about THIS institution (not affiliated colleges, departments or other institutes mentioned).
naac_grade = its current NAAC accreditation grade, one of ${GRADES.join(', ')}. null if not stated or if only NBA/NIRF is mentioned.
established_year = the year the institution was founded/established (4 digits).
annual_fees_min / annual_fees_max = tuition fee in rupees PER YEAR for its regular undergraduate programmes (lowest and highest stated; if only one, put it in both). Use null if the fee is only given per semester, per credit, as a total for the whole course, or is for hostel/mess only.
JSON: {"naac_grade":{"value":"A++","quote":"..."},"established_year":{"value":1959,"quote":"..."},"annual_fees_min":{"value":150000,"quote":"..."},"annual_fees_max":{"value":250000,"quote":"..."}}`

  const ai = await extractJson(task, buildContext(gathered.pages, KEYWORDS, 9000), Output)
  if (!opts.dryRun) await saveCache(db, gathered.pages)
  await db.from('colleges').update({ last_checked_at: today.toISOString() }).eq('id', c.id)
  if (!ai) return { ...res, skipped: 'AI could not read the website' }

  const norm = new Map<string, string>()
  const own = [c.website_url]
  const fields: Record<string, Change> = {}
  let sourceUrl = c.website_url
  let confirmedAny = false
  const confirm = (key: string, quote: string | null | undefined, supports: (q: string) => boolean): boolean => {
    const url = locateQuote(quote, gathered.pages, norm)
    if (url && isOfficialUrl(url, own) && supports(quote!)) {
      sourceUrl = url
      confirmedAny = true
      return true
    }
    res.dropped.push(`${c.name} ${key}: evidence failed`)
    return false
  }

  const g = ai.naac_grade
  const grade = GRADES.find((x) => x === g?.value?.replace(/\s+/g, '').toUpperCase())
  if (grade && confirm('naac_grade', g!.quote, (q) => quoteSupportsGrade(grade, q)) && normalize(grade) !== normalize(c.naac_grade ?? '')) {
    fields.naac_grade = { old: c.naac_grade, new: grade, evidence: g!.quote! }
  }

  const y = ai.established_year?.value
  if (y && y >= 1800 && y <= today.getFullYear() && confirm('established_year', ai.established_year!.quote, (q) => quoteSupportsYear(y, q)) && y !== c.established_year) {
    fields.established_year = { old: c.established_year, new: y, evidence: ai.established_year!.quote! }
  }

  for (const k of ['annual_fees_min', 'annual_fees_max'] as const) {
    const f = ai[k]
    if (f?.value == null || f.value < 1000 || f.value > 5_000_000) continue
    if (confirm(k, f.quote, (q) => quoteSupportsNumber(f.value!, q)) && Number(c[k]) !== f.value) {
      fields[k] = { old: c[k], new: f.value, evidence: f.quote! }
    }
  }

  if (!Object.keys(fields).length) {
    // Re-confirmed at least one stored value word for word on the official site
    if (confirmedAny && !opts.dryRun) await db.from('colleges').update({ verified_at: today.toISOString() }).eq('id', c.id)
    return res
  }

  const feeMin = (fields.annual_fees_min?.new as number | undefined) ?? c.annual_fees_min
  const feeMax = (fields.annual_fees_max?.new as number | undefined) ?? c.annual_fees_max
  const issues = feeMin && feeMax && feeMin > feeMax ? ['minimum fee is above maximum fee'] : []

  res.outcomes.push(
    await submitProposal(
      db,
      opts.runId,
      {
        entity: 'college',
        table: 'colleges',
        recordId: c.id,
        label: c.name,
        fields,
        extra: { verified_at: today.toISOString() },
        sourceUrl,
        official: isOfficialUrl(sourceUrl, own),
        overwritesVerified: !!c.verified_at && Object.values(fields).some((x) => x.old !== null),
        forceReview: issues.length ? `Failed sanity checks: ${issues.join('; ')}` : undefined,
      },
      opts.dryRun
    )
  )
  return res
}
