import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { quoteSupportsDate, quoteSupportsNumber } from './evidence'
import { validateScholarship } from './validate'
import { buildContext, gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'

const DateFact = z.object({ value: z.string().nullish(), quote: z.string().nullish() }).nullish()
const NumFact = z.object({ value: z.coerce.number().nullish(), quote: z.string().nullish() }).nullish()
const Output = z.object({
  scheme_found: z.boolean().default(false),
  application_deadline: DateFact,
  amount_min: NumFact,
  amount_max: NumFact,
})

const KEYWORDS = /(last date|deadline|closing|apply|application|amount|₹|rs\.?|inr|per annum|per month|stipend|scholarship|fresh|renewal)/i

export type ScholarshipRow = {
  id: string
  name: string
  provider: string
  application_url: string | null
  application_deadline: string | null
  amount_min: number | null
  amount_max: number | null
  verified_at: string | null
}

/** timestamptz → calendar date in India */
function toISTDate(ts: string | null): string | null {
  if (!ts) return null
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  return new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

export async function updateScholarship(
  db: SupabaseClient,
  s: ScholarshipRow,
  opts: { runId: string | null; dryRun: boolean; force: boolean; today?: Date }
): Promise<{ slug: string; outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[] }> {
  const today = opts.today ?? new Date()
  const res = { slug: s.name, outcomes: [] as ProposalOutcome[], errors: [] as string[], dropped: [] as string[] }
  if (!s.application_url) return { ...res, skipped: 'no application_url' }

  const gathered = await gatherPages(db, [s.application_url], 3)
  res.errors.push(...gathered.errors)
  if (!gathered.pages.length) return { ...res, skipped: 'could not fetch page' }
  if (!gathered.changed && !opts.force) {
    await db.from('scholarships').update({ last_checked_at: today.toISOString() }).eq('id', s.id)
    return { ...res, skipped: 'page unchanged' }
  }

  const task = `Scholarship scheme: "${s.name}" (provider: ${s.provider}). Today is ${today.toISOString().slice(0, 10)}.
The page may list many schemes; only report facts that are explicitly about THIS scheme. Set scheme_found=false if it is not mentioned.
application_deadline = last date to apply for the current/upcoming cycle (fresh applications). Ignore past cycles.
amount_min / amount_max = scholarship amount in rupees per year as integers (if only one amount, put it in both). Use null if amounts are per-month or unclear.
JSON: {"scheme_found":true,"application_deadline":{"value":"YYYY-MM-DD","quote":"..."},"amount_min":{"value":12000,"quote":"..."},"amount_max":{"value":20000,"quote":"..."}}`

  const ai = await extractJson(task, buildContext(gathered.pages, KEYWORDS, 9000), Output)
  if (!opts.dryRun) await saveCache(db, gathered.pages)
  await db.from('scholarships').update({ last_checked_at: today.toISOString() }).eq('id', s.id)
  if (!ai || !ai.scheme_found) return { ...res, skipped: ai ? 'scheme not mentioned on page' : 'AI could not read page' }

  const norm = new Map<string, string>()
  const own = [s.application_url]
  const fields: Record<string, Change> = {}
  let sourceUrl = s.application_url

  const dl = ai.application_deadline
  if (dl?.value) {
    const url = locateQuote(dl.quote, gathered.pages, norm)
    if (url && isOfficialUrl(url, own) && quoteSupportsDate(dl.value, dl.quote!)) {
      const oldDate = toISTDate(s.application_deadline)
      if (dl.value !== oldDate) {
        fields.application_deadline = { old: s.application_deadline, new: `${dl.value}T23:59:59+05:30`, evidence: dl.quote! }
        sourceUrl = url
      }
    } else res.dropped.push(`${s.name} deadline: evidence failed`)
  }

  for (const k of ['amount_min', 'amount_max'] as const) {
    const f = ai[k]
    if (f?.value == null) continue
    const url = locateQuote(f.quote, gathered.pages, norm)
    if (url && isOfficialUrl(url, own) && quoteSupportsNumber(f.value, f.quote!)) {
      if (Number(s[k]) !== f.value) fields[k] = { old: s[k], new: f.value, evidence: f.quote! }
    } else res.dropped.push(`${s.name} ${k}: evidence failed`)
  }

  if (!Object.keys(fields).length) {
    if (!opts.dryRun) await db.from('scholarships').update({ verified_at: today.toISOString() }).eq('id', s.id)
    return res
  }

  const merged = {
    application_deadline: (fields.application_deadline?.new as string | undefined)?.slice(0, 10) ?? toISTDate(s.application_deadline),
    amount_min: (fields.amount_min?.new as number | undefined) ?? s.amount_min,
    amount_max: (fields.amount_max?.new as number | undefined) ?? s.amount_max,
  }
  const issues = validateScholarship(merged, today)

  res.outcomes.push(
    await submitProposal(
      db,
      opts.runId,
      {
        entity: 'scholarship',
        table: 'scholarships',
        recordId: s.id,
        label: s.name,
        fields,
        extra: { verified_at: today.toISOString() },
        sourceUrl,
        official: isOfficialUrl(sourceUrl, own),
        overwritesVerified: !!s.verified_at && Object.values(fields).some((c) => c.old !== null),
        forceReview: issues.length ? `Failed sanity checks: ${issues.join('; ')}` : undefined,
      },
      opts.dryRun
    )
  )
  return res
}
