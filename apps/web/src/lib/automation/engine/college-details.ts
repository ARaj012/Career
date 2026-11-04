/**
 * Detailed college facts from the college's own website: programmes with
 * fees, placement reports (average / median / highest), admission process
 * and institute scholarships.
 *
 * One AI call per college keeps within the free Groq quota. As everywhere
 * in this engine the AI only *reads*: every value must come with a quote
 * that is on an official page and contains the value, otherwise it is
 * dropped. Hand-typed values are replaced by retire_replaced_unverified().
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { normalize, quoteSupportsNumber } from './evidence'
import { fetchPage, hostOf, type FetchedPage } from './http'
import { buildContext, isOfficialUrl, locateQuote, saveCache } from './sources'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'

// The AI sometimes writes null for "none found"; treat it as an empty list instead of discarding the whole reading
const orEmpty = <T,>(v: T[] | null | undefined): T[] => v ?? []

const Num = z.object({ value: z.coerce.number().nullish(), quote: z.string().nullish() }).nullish()
const Output = z.object({
  programmes: z
    .array(
      z.object({
        course_name: z.string(),
        degree_type: z.string().nullish(),
        duration_years: z.coerce.number().nullish(),
        annual_fee: Num,
        semester_fee: Num,
        total_fee: Num,
        seats: Num,
      })
    )
    .nullish()
    .transform(orEmpty),
  placements: z
    .array(
      z.object({
        year: z.coerce.number().int(),
        programme: z.string().nullish(),
        average: Num,
        median: Num,
        highest: Num,
        placed: Num,
        eligible: Num,
        recruiters: z.object({ value: z.string().nullish(), quote: z.string().nullish() }).nullish(),
      })
    )
    .nullish()
    .transform(orEmpty),
  admission_steps: z.array(z.string()).nullish().transform(orEmpty),
  scholarships: z.array(z.object({ name: z.string().nullish(), quote: z.string().nullish() })).nullish().transform(orEmpty),
})
type Out = z.infer<typeof Output>

const FEE_WORDS = /(fee|tuition|₹|rs\.?|inr|per annum|per year|per semester|b\.?\s?tech|b\.?e\b|m\.?\s?tech|mba|pgdm|mbbs|b\.?sc|m\.?sc|b\.?com|b\.?a\b|ll\.?b|b\.?arch|ph\.?\s?d|programme|program|course|intake|seats|duration)/i
const PLACEMENT_WORDS = /(placement|placed|package|ctc|lpa|salary|highest|average|median|recruiter|offers|lakh|crore|batch|season)/i
const ADMISSION_WORDS = /(admission|eligib|entrance|exam|jee|neet|cat\b|gate|clat|cuet|counsel|josaa|merit|apply|application|selection|interview)/i
const SCHOLARSHIP_WORDS = /(scholarship|fee waiver|freeship|financial assistance|merit-cum-means|concession|stipend|fellowship)/i

// Which pages may supply which facts, judged by URL and the text of the link that led
// there (never the page body: every page's menu says "Admissions" and "Programmes").
// Keeps homepage news, events and job adverts from passing as fees or an admission process.
export const TOPIC = {
  fees: /(fee|fees|tuition|prospectus|information.?brochure|bulletin|fee.?structure)/i,
  placements: /(placement|t\s?&\s?p|tnp|tpo|training.?(and|&).?placement|career.?development|ccd|placement.?statistic)/i,
  admission: /(admission|admissions|how.?to.?apply|eligibility|prospectus|bulletin)/i,
  scholarships: /(scholarship|financial.?aid|fee.?waiver|freeship|fee.?concession)/i,
} as const
type Topic = keyof typeof TOPIC
// Pages that look topical but never hold these facts
const NOISE = /(recruit|faculty|jobs?\b|career.?at|vacanc|tender|event|workshop|fdp|conference|seminar|webinar|holiday|hostel|mess|result|declaration|login|signin|news|gallery|alumni)/i
// Second hop, per topic: the documents inside a topic page
const DOC: Record<Topic, RegExp> = {
  fees: /(fee|tuition|structure|schedule)/i,
  placements: /(placement|statistic|report|brochure|record|season|\b20\d\d)/i,
  admission: /(admission|bulletin|prospectus|eligib|procedure|how.?to.?apply)/i,
  scholarships: /(scholarship|waiver|freeship|financial)/i,
}

const label = new Map<string, string>() // url → text of the link that led to it
export const topicOf = (p: FetchedPage): Topic[] => {
  const key = `${decodeURIComponent(p.finalUrl)} ${label.get(p.url) ?? ''}`
  if (NOISE.test(key)) return []
  return (Object.keys(TOPIC) as Topic[]).filter((t) => TOPIC[t].test(key))
}
const topicPages = (pages: FetchedPage[], t: Topic) => pages.filter((p) => topicOf(p).includes(t))

/** Same-site links on a page whose text or URL matches, best first. */
function linksMatching(p: FetchedPage, re: RegExp, max: number): { url: string; text: string }[] {
  const host = hostOf(p.finalUrl)
  return p.links
    .filter((l) => { const h = hostOf(l.url); return (h === host || h.endsWith(`.${host}`) || host.endsWith(`.${h}`)) && !/^(mailto|tel|javascript):/i.test(l.url) })
    .filter((l) => re.test(`${l.text} ${decodeURIComponent(l.url)}`) && !NOISE.test(`${l.text} ${l.url}`))
    .sort((a, b) => Number(/\.pdf($|\?)/i.test(b.url)) - Number(/\.pdf($|\?)/i.test(a.url)))
    .slice(0, max)
}

/** URLs from the site's sitemap that look like fee / placement / admission / scholarship pages. */
async function sitemapUrls(home: string, max: number): Promise<string[]> {
  try {
    const xml = (await fetchPage(new URL('/sitemap.xml', home).toString())).text
    const host = hostOf(home)
    return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
      .map((m) => m[1])
      .filter((u) => hostOf(u).endsWith(host) && Object.values(TOPIC).some((re) => re.test(decodeURIComponent(u))) && !NOISE.test(u))
      .sort((a, b) => a.length - b.length) // section pages before deep articles
      .slice(0, max)
  } catch {
    return []
  }
}

/** Homepage → topic pages (links + sitemap) → their fee / placement / admission documents. */
/** "https://www.hau.ac.in/x" ⇄ "https://hau.ac.in/x" */
export function otherWww(url: string): string {
  const u = new URL(url)
  u.hostname = u.hostname.startsWith('www.') ? u.hostname.slice(4) : `www.${u.hostname}`
  return u.toString()
}

export async function discover(db: SupabaseClient, home: string): Promise<{ pages: FetchedPage[]; changed: boolean; errors: string[] }> {
  const pages: FetchedPage[] = []
  const errors: string[] = []
  const seen = new Set<string>()
  const get = async (url: string, text = '') => {
    if (seen.has(url)) return null
    seen.add(url)
    label.set(url, text)
    try {
      const p = await fetchPage(url)
      pages.push(p)
      seen.add(p.finalUrl)
      return p
    } catch (err) {
      errors.push((err as Error).message)
      return null
    }
  }
  // Many college sites only work with or only without "www." (certificate issued for one
  // name, or no DNS record for the other): try the other form of the same domain
  const root = (await get(home)) ?? (/certificate|ALTNAME|domain not found/i.test(errors.at(-1) ?? '') ? await get(otherWww(home)) : null)
  if (!root) return { pages, changed: false, errors }
  if (root.url !== home) errors.splice(-1, 1) // the first form failed but the other worked

  // Hop 1: up to 3 entry pages per topic from the homepage, then the sitemap
  const level1: { url: string; text: string }[] = []
  for (const t of Object.keys(TOPIC) as Topic[]) level1.push(...linksMatching(root, TOPIC[t], 3))
  for (const u of await sitemapUrls(root.finalUrl, 6)) level1.push({ url: u, text: '' })
  const topical: FetchedPage[] = []
  for (const l of level1.slice(0, 14)) {
    const p = await get(l.url, l.text)
    if (p) topical.push(p)
  }
  // Hop 2: the fee schedule / placement statistics / bulletin inside each topic page, 3 per topic
  for (const t of Object.keys(TOPIC) as Topic[]) {
    let budget = 3
    for (const p of topical.filter((x) => topicOf(x).includes(t))) {
      for (const l of linksMatching(p, DOC[t], 4)) {
        if (budget <= 0) break
        if (await get(l.url, l.text)) budget--
      }
    }
  }

  const { data: cached } = await db.from('automation_page_cache').select('url, content_hash').in('url', pages.map((p) => p.url))
  const known = new Map((cached ?? []).map((c) => [c.url, c.content_hash]))
  return { pages, changed: pages.some((p) => known.get(p.url) !== p.hash), errors }
}

export type CollegeDetailRow = {
  id: string
  name: string
  website_url: string | null
  admission_process: string | null
  admission_verified_at: string | null
  annual_fees_min: number | null
  annual_fees_max: number | null
  fees_verified_at: string | null
  institute_scholarships: unknown
  details_read_at?: string | null
}

const DEGREE = /\b(b\.?\s?tech|b\.?e|m\.?\s?tech|m\.?e|mba|pgdm|pgp|mbbs|md|ms|bds|mds|b\.?sc|m\.?sc|b\.?com|m\.?com|b\.?a|m\.?a|ll\.?b|ll\.?m|b\.?arch|m\.?arch|b\.?des|m\.?des|b\.?pharm|m\.?pharm|ph\.?\s?d|bba|bca|mca)\b/i

/** A fee quote must name the programme it belongs to, so fees cannot drift onto another course. */
export function quoteNamesCourse(courseName: string, quote: string): boolean {
  const q = ` ${normalize(quote)} `
  const deg = DEGREE.exec(courseName)?.[0]
  if (deg) {
    const spaced = normalize(deg) // "b tech"
    const compact = spaced.replace(/\s+/g, '') // "btech"
    // Whole-word match only, so "BA" never matches inside another word
    if (q.includes(` ${spaced} `) || q.includes(` ${compact} `)) return true
  }
  const words = normalize(courseName).split(' ').filter((w) => w.length >= 5 && !/^(bachelor|master|science|technology|engineering|degree|programme|program|course|honours)$/.test(w))
  return words.some((w) => q.includes(` ${w} `))
}

/** A placement figure must sit next to its year: "2024", "2023-24" or "2023–2024". */
export function quoteNamesYear(year: number, quote: string): boolean {
  const y = String(year)
  const prev = String(year - 1)
  return quote.includes(y) || new RegExp(`${prev}\\s*[-–/]\\s*(${y.slice(2)}|${y})`).test(quote)
}

// "2023-24" ends in 2024; a bare "2024" is that year
const seasonYear = (cell: string): number | null => {
  const m = /^(20\d\d)(?:\s*[-–/]\s*(\d\d|20\d\d))?$/.exec(cell)
  return m ? Number(m[1]) + (m[2] ? 1 : 0) : null
}
const METRIC: [RegExp, 'highest' | 'average' | 'median'][] = [[/\b(highest|maximum)\b/i, 'highest'], [/\b(average|mean)\b/i, 'average'], [/\bmedian\b/i, 'median']]
export type TableFigure = { year: number; metric: 'highest' | 'average' | 'median'; value: number; header: string; row: string }

/**
 * Placement tables, as htmlToText flattens them: a header of years ("2020 | 2021 | 2022")
 * over rows such as "Average CTC (INR Lakhs per annum) | 23.2 | 24.6 | 26.4". One figure per
 * year column, in rupees. Rows whose label states no unit are skipped: "30" alone could be lakhs or rupees.
 */
export function placementTable(text: string): TableFigure[] {
  const out: TableFigure[] = []
  let years: number[] | null = null
  let header = ''
  for (const line of text.split('\n').map((l) => l.trim())) {
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length < 2) { years = null; continue }
    const ys = cells.map(seasonYear)
    if (ys.every((y) => y !== null)) { years = ys as number[]; header = line; continue }
    if (cells.length > 2 && ys.slice(1).every((y) => y !== null)) { years = ys.slice(1) as number[]; header = line; continue } // "Year | 2020 | 2021"
    if (!years) continue
    const [label, ...vals] = cells
    const metric = METRIC.find(([re]) => re.test(label))?.[1]
    if (!metric || vals.length !== years.length) continue
    const unit = /\b(lakhs?|lacs?|lpa)\b/i.test(label) ? 100_000 : /\b(crores?|cr)\b/i.test(label) ? 10_000_000 : /(\binr\b|\brs\b|₹)/i.test(label) ? 1 : null
    if (unit === null) continue
    vals.forEach((v, i) => {
      const n = Number(v.replace(/,/g, ''))
      if (/\d/.test(v) && Number.isFinite(n) && n > 0) out.push({ year: years![i], metric, value: Math.round(n * unit), header, row: line })
    })
  }
  return out
}

export async function updateCollegeDetails(
  db: SupabaseClient,
  c: CollegeDetailRow,
  opts: { runId: string | null; dryRun: boolean; force: boolean; today?: Date }
): Promise<{ slug: string; outcomes: ProposalOutcome[]; skipped?: string; errors: string[]; dropped: string[] }> {
  const today = opts.today ?? new Date()
  const Y = today.getFullYear()
  const res = { slug: c.name, outcomes: [] as ProposalOutcome[], errors: [] as string[], dropped: [] as string[] }
  if (!c.website_url) return { ...res, skipped: 'no website_url' }

  const gathered = await discover(db, c.website_url)
  res.errors.push(...gathered.errors)
  if (!gathered.pages.length) return { ...res, skipped: 'could not fetch website' }
  // The site answered only on the other www form: keep that one, so the other checks reach it too
  if (gathered.pages[0].url === otherWww(c.website_url)) {
    if (!opts.dryRun) await db.from('colleges').update({ website_url: gathered.pages[0].url }).eq('id', c.id)
    c = { ...c, website_url: gathered.pages[0].url }
  }
  // Other checks cache the same pages, so "unchanged" only counts once this reader has read them
  if (!gathered.changed && c.details_read_at && !opts.force) return { ...res, skipped: 'website unchanged' }

  const byTopic = {
    fees: topicPages(gathered.pages, 'fees'),
    placements: topicPages(gathered.pages, 'placements'),
    admission: topicPages(gathered.pages, 'admission'),
    scholarships: topicPages(gathered.pages, 'scholarships'),
  }
  if (!Object.values(byTopic).some((p) => p.length)) return { ...res, skipped: 'no fee, placement, admission or scholarship pages found on the website' }
  const section = (title: string, pages: FetchedPage[], words: RegExp, budget: number) =>
    `== ${title} ==\n${pages.length ? buildContext(pages, words, budget) : '(no such page found on the website)'}`

  // One call, four focused excerpts from topic pages only: keeps each college to ~4k tokens
  const context = [
    section('FEES AND PROGRAMMES', byTopic.fees, FEE_WORDS, 4500),
    section('PLACEMENTS', byTopic.placements, PLACEMENT_WORDS, 3000),
    section('ADMISSION', byTopic.admission, ADMISSION_WORDS, 1800),
    section('SCHOLARSHIPS', byTopic.scholarships, SCHOLARSHIP_WORDS, 900),
  ].join('\n\n')

  const task = `Institution: "${c.name}". Today is ${today.toISOString().slice(0, 10)}. Report only facts about THIS institution as written in its official pages below.
programmes: each degree programme it offers (e.g. "B.Tech Computer Science and Engineering", "MBA"). course_name as written; degree_type = UG, PG, Integrated, Diploma or Doctoral; duration_years if stated.
  annual_fee = tuition/academic fee per YEAR in rupees for the current or latest academic year; semester_fee if only a per-semester fee is given; total_fee if only a whole-course fee is given; seats = sanctioned intake. Each with a quote that contains the amount AND names the programme. null when not stated.
placements: placement statistics for the last 5 placement seasons. year = calendar year the season ended (2023-24 → 2024). programme if the figures are for one programme only. average / median / highest package in rupees per annum (1 LPA = 100000); placed = students placed; eligible = students eligible/registered. Each quote must contain the value AND the year/season.
  recruiters = up to 10 company names copied from one quote.
admission_steps: up to 6 sentences copied CHARACTER-FOR-CHARACTER from the text that explain how students get admitted (entrance exam, counselling, eligibility, application). No paraphrasing.
scholarships: scholarships, fee waivers or concessions the INSTITUTION offers (not general government schemes unless the text says the institution administers them), with a quote describing each.
JSON: {"programmes":[{"course_name":"…","degree_type":"UG","duration_years":4,"annual_fee":{"value":225000,"quote":"…"},"semester_fee":null,"total_fee":null,"seats":{"value":120,"quote":"…"}}],"placements":[{"year":2024,"programme":null,"average":{"value":1850000,"quote":"…"},"median":null,"highest":{"value":12000000,"quote":"…"},"placed":null,"eligible":null,"recruiters":{"value":"Google, Microsoft","quote":"…"}}],"admission_steps":["…"],"scholarships":[{"name":"…","quote":"…"}]}`

  const ai = await extractJson(task, context, Output)
  if (process.env.AUTOMATION_DEBUG) {
    console.log('    [debug] pages per topic:', Object.fromEntries(Object.entries(byTopic).map(([k, v]) => [k, v.length])), 'context chars:', context.length)
    console.log('    [debug] AI:', JSON.stringify(ai).slice(0, 2500))
  }
  // Cached only after a successful read, so a failed read is retried next time
  if (!ai) return { ...res, skipped: 'AI could not read the website' }
  if (!opts.dryRun) {
    await saveCache(db, gathered.pages)
    await db.from('colleges').update({ details_read_at: today.toISOString() }).eq('id', c.id)
  }

  // A quote only counts if it is on a page of the matching topic
  const norm = new Map<string, string>()
  const own = [c.website_url]
  const onTopic = (pages: FetchedPage[]): OnSite => (quote) => {
    const url = locateQuote(quote, pages, norm)
    return url && isOfficialUrl(url, own) ? url : null
  }

  // A programme named word for word on a fee or admission page is a fact even without a fee
  const nameOn = [...byTopic.fees, ...byTopic.admission].map((p) => ({ url: p.finalUrl, text: ` ${normalize(p.text)} ` }))
  const nameOnSite = (name: string) => {
    const n = normalize(name)
    return n.replace(/\s/g, '').length >= 4 ? (nameOn.find((p) => p.text.includes(` ${n} `))?.url ?? null) : null
  }
  // Placement pages titled with one season ("Placement Statistics 2025-26") date the figures on them
  const seasonOf = (url: string): number | null => {
    const page = byTopic.placements.find((p) => p.finalUrl === url)
    const seasons = new Set([...(page?.text.slice(0, 400) ?? '').matchAll(/\b(20\d\d)\s*[-–]\s*(\d\d|20\d\d)\b/g)].map((m) => Number(m[1]) + 1))
    return seasons.size === 1 ? [...seasons][0] : null
  }

  await programmes(db, c, ai, onTopic(byTopic.fees), nameOnSite, res, opts)
  const placementPages = byTopic.placements.filter((p) => isOfficialUrl(p.finalUrl, own))
  await placementReports(db, c, ai, onTopic(byTopic.placements), placementPages, seasonOf, res, opts, Y)
  await textFields(db, c, ai, onTopic(byTopic.admission), onTopic(byTopic.scholarships), res, opts, today)
  return res
}

type Res = { outcomes: ProposalOutcome[]; dropped: string[] }
type OnSite = (q: string | null | undefined) => string | null
type Opts = { runId: string | null; dryRun: boolean }

// Also groups of programmes ("PG Programmes in the Teaching Departments") and admission
// channels ("BTech Lateral Entry CE All India Merit")
const NOT_A_PROGRAMME_WORDS = /(\b(19|20)\d{2}\b|session|application|registration|entrance|\bexam|\btest\b|admission|notification|result|counsel|brochure|programmes in|\bdepartments\b|lateral entry|\bmerit\b|\bquota\b)/i
// Case-sensitive: entrance-test acronyms (VITEEE, VITREE), not words ending in "ee" like "Degree"
const ENTRANCE_ACRONYM = /[A-Z]{3,}EE\b|\bREE\b/

/** Application rounds and entrance tests ("B.Tech Foreign 2026 (December session)", "VITREE-2027") are not programmes. */
export function isNotAProgramme(name: string): boolean {
  return NOT_A_PROGRAMME_WORDS.test(name) || ENTRANCE_ACRONYM.test(name)
}

/**
 * "Admission in Master of Science Programme" → "Master of Science Programme",
 * "Integrated PhD Admission" → "Integrated PhD", "M.Tech Programmes" → "M.Tech",
 * "BTECH (UG)" → "BTECH", "COURSE: MBA" → "MBA".
 */
export function programmeName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(course|programme|program)\s*:\s*/i, '')
    .replace(/^admissions?\s+(in|to|for|into)\s+(the\s+)?/i, '')
    .replace(/\s+admissions?$/i, '')
    .replace(/\s*\((UG|PG)\)$/i, '')
    .replace(/\s+programmes$/i, '')
    // "B.Tech. Programme" → "B.Tech."; "Doctoral Programme" keeps its word, it names the programme
    .replace(/^(.{1,12}?)\s+programme$/i, (whole, degree: string) => (DEGREE.test(degree) ? degree : whole))
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ')')
    .trim()
}

/** The level from the name when it is unambiguous; otherwise the AI's reading. */
export function degreeType(name: string, aiType: string | null | undefined): string | null {
  if (/\b(ph\.?\s?d|doctoral|doctor of philosophy)\b/i.test(name)) return 'Doctoral'
  if (/\b(dual degree|integrated|bs-ms)\b/i.test(name)) return 'Integrated'
  return aiType ?? null
}

async function programmes(db: SupabaseClient, c: CollegeDetailRow, ai: Out, onSite: OnSite, nameOnSite: (n: string) => string | null, res: Res, opts: Opts) {
  const { data: existing } = await db.from('college_courses').select('id, course_name, annual_fees_min, total_fees, total_seats').eq('college_id', c.id).eq('source_type', 'official')
  const byName = new Map((existing ?? []).map((r) => [normalize(r.course_name), r]))
  const seen = new Set<string>()

  for (const p of ai.programmes.slice(0, 40)) {
    const name = programmeName(p.course_name)
    const key = normalize(name)
    if (!key || seen.has(key)) continue
    if (isNotAProgramme(name)) { res.dropped.push(`${c.name} · "${name}": not a degree programme`); continue }
    seen.add(key)

    const fact = (f: { value?: number | null; quote?: string | null } | null | undefined, label: string, needsName: boolean) => {
      if (f?.value == null) return null
      const url = onSite(f.quote)
      if (!url || !quoteSupportsNumber(f.value, f.quote!) || (needsName && !quoteNamesCourse(name, f.quote!))) {
        res.dropped.push(`${c.name} · ${name} ${label}: evidence failed`)
        return null
      }
      return { value: f.value, quote: f.quote!, url }
    }
    const annual = fact(p.annual_fee, 'annual fee', true)
    const semester = annual ? null : fact(p.semester_fee, 'semester fee', true)
    const total = fact(p.total_fee, 'total fee', true)
    const seats = fact(p.seats, 'seats', true)
    const yearly = annual?.value ?? (semester ? semester.value * 2 : null)
    if (yearly !== null && (yearly < 1_000 || yearly > 5_000_000)) { res.dropped.push(`${c.name} · ${name}: implausible fee ${yearly}`); continue }
    const old = byName.get(key)
    const namedAt = annual || semester || total || seats ? null : nameOnSite(name)
    if (!annual && !semester && !total && !seats && (!namedAt || old)) continue // name not on the site, or already listed
    const fields: Record<string, Change> = {}
    const set = (k: string, v: unknown, ev: string | null, before: unknown) => { if (v !== null && v !== undefined && v !== before) fields[k] = { old: before ?? null, new: v, evidence: ev } }
    set('annual_fees_min', yearly, annual?.quote ?? semester?.quote ?? null, old?.annual_fees_min)
    set('annual_fees_max', yearly, null, undefined)
    set('total_fees', total?.value ?? null, total?.quote ?? null, old?.total_fees)
    set('total_seats', seats?.value ?? null, seats?.quote ?? null, old?.total_seats)
    if (!old) {
      set('course_name', name, null, undefined)
      const level = degreeType(name, p.degree_type)
      if (level) set('degree_type', level, null, undefined)
      if (p.duration_years && p.duration_years > 0 && p.duration_years <= 7) set('duration_years', p.duration_years, null, undefined)
    }
    if (!Object.keys(fields).some((k) => k !== 'annual_fees_max')) continue
    const src = (annual ?? semester ?? total ?? seats)?.url ?? namedAt!
    res.outcomes.push(
      await submitProposal(db, opts.runId, {
        entity: 'college',
        table: 'college_courses',
        recordId: old?.id ?? null,
        parentId: c.id,
        label: `${c.name} · ${name}`,
        fields,
        insertKey: old ? undefined : { college_id: c.id, source_type: 'official', mode: 'Full-Time' },
        extra: { source_url: src, verified_at: new Date().toISOString(), fee_note: semester ? `₹${semester.value.toLocaleString('en-IN')} per semester (official)` : null },
        sourceUrl: src,
        official: true,
        overwritesVerified: false,
      }, opts.dryRun)
    )
  }
}

async function placementReports(db: SupabaseClient, c: CollegeDetailRow, ai: Out, onSite: OnSite, pages: FetchedPage[], seasonOf: (url: string) => number | null, res: Res, opts: Opts, Y: number) {
  const { data: existing } = await db.from('college_placements').select('id, year, program_level, average_package, median_package, highest_package, students_placed, total_eligible_students, top_recruiters').eq('college_id', c.id).eq('source_type', 'official_report')
  const levelOf = (programme: string | null | undefined) => (programme?.trim() ? programme.trim().slice(0, 60) : 'All programs')

  // In a year-column table the AI can only quote a whole row, whose year and unit sit in the header,
  // so the figures are read from the table itself; the AI's quote of a row names the table and its programme
  const figures = pages.flatMap((pg) => placementTable(pg.text).map((f) => ({ ...f, url: pg.finalUrl })))
  const fromTable = new Map<string, { value: number; quote: string; url: string }>()
  const tableEntries: Out['placements'] = []
  for (const p of ai.placements) {
    const quotes = [p.average, p.median, p.highest].map((f) => (f?.quote ? normalize(f.quote) : '')).filter(Boolean)
    const hit = figures.find((f) => quotes.includes(normalize(f.row)))
    if (!hit) continue
    const level = levelOf(p.programme)
    for (const f of figures.filter((x) => x.url === hit.url && x.header === hit.header)) {
      fromTable.set(`${f.year}|${level}|${f.metric}`, { value: f.value, quote: `${f.header}\n${f.row}`, url: f.url })
      if (!tableEntries.some((e) => e.year === f.year && levelOf(e.programme) === level)) {
        tableEntries.push({ year: f.year, programme: p.programme, average: null, median: null, highest: null, placed: null, eligible: null, recruiters: null })
      }
    }
  }

  const taken = new Set<string>()
  for (const p of [...tableEntries, ...ai.placements]) {
    if (p.year < Y - 5 || p.year > Y) continue
    const level = levelOf(p.programme)
    const key = `${p.year}|${level}`
    if (taken.has(key)) continue
    taken.add(key)

    const fact = (f: { value?: number | null; quote?: string | null } | null | undefined, label: string, isMoney: boolean) => {
      const t = fromTable.get(`${p.year}|${level}|${label}`)
      if (t) {
        if (t.value >= 100_000 && t.value <= 200_000_000) return t
        res.dropped.push(`${c.name} ${p.year} ${label}: implausible table figure ${t.value}`)
        return null
      }
      if (f?.value == null) return null
      const url = onSite(f.quote)
      const plausible = isMoney ? f.value >= 100_000 && f.value <= 200_000_000 : f.value > 0 && f.value < 50_000
      const dated = url && (quoteNamesYear(p.year, f.quote!) || seasonOf(url) === p.year)
      if (!url || !plausible || !quoteSupportsNumber(f.value, f.quote!) || !dated) {
        res.dropped.push(`${c.name} ${p.year} ${label}: evidence failed`)
        return null
      }
      return { value: f.value, quote: f.quote!, url }
    }
    const avg = fact(p.average, 'average', true)
    const med = fact(p.median, 'median', true)
    const high = fact(p.highest, 'highest', true)
    const placed = fact(p.placed, 'placed', false)
    const eligible = fact(p.eligible, 'eligible', false)
    if (avg && high && avg.value > high.value) { res.dropped.push(`${c.name} ${p.year}: average above highest`); continue }
    const recruitersUrl = p.recruiters?.value ? onSite(p.recruiters.quote) : null
    const recruiters = recruitersUrl && p.recruiters!.value!.split(',').every((n) => normalize(p.recruiters!.quote!).includes(normalize(n))) ? p.recruiters!.value!.slice(0, 300) : null
    if (!avg && !med && !high && !placed) continue

    const old = (existing ?? []).find((r) => r.year === p.year && r.program_level === level)
    const fields: Record<string, Change> = {}
    const set = (k: string, f: { value: number; quote: string } | null) => {
      const before = old ? (old as Record<string, unknown>)[k] ?? null : null
      if (f && Number(before) !== f.value) fields[k] = { old: before, new: f.value, evidence: f.quote }
    }
    set('average_package', avg); set('median_package', med); set('highest_package', high)
    set('students_placed', placed); set('total_eligible_students', eligible)
    if (recruiters && recruiters !== old?.top_recruiters) fields.top_recruiters = { old: old?.top_recruiters ?? null, new: recruiters, evidence: p.recruiters!.quote! }
    if (placed && eligible && placed.value <= eligible.value) fields.placement_rate = { old: null, new: Math.round((placed.value / eligible.value) * 1000) / 10, evidence: null }
    if (!Object.keys(fields).length) continue
    const src = (avg ?? med ?? high ?? placed)!.url
    res.outcomes.push(
      await submitProposal(db, opts.runId, {
        entity: 'college',
        table: 'college_placements',
        recordId: old?.id ?? null,
        parentId: c.id,
        label: `${c.name} · placements ${p.year}${level === 'All programs' ? '' : ` · ${level}`}`,
        fields,
        insertKey: old ? undefined : { college_id: c.id, year: p.year, program_level: level, source_type: 'official_report' },
        extra: { source_url: src, notes: 'From the institution’s own placement report' },
        sourceUrl: src,
        official: true,
        overwritesVerified: false,
      }, opts.dryRun)
    )
  }
}

// Announcements ("Applications are invited…", "Registration and Orientation…") are not a process
const NEWS = /^(applications? (are|is) invited|registration and orientation|results? (of|for|declared)|declaration of|last date|notice|circular|corrigendum|extension)/i
const PROCESS = /(through|via|based on|on the basis of|rank|score|merit|counsel|eligib|entrance|qualif|interview|selection|must|should|minimum|criteria|josaa|csab|ccmt|neet|jee|gate|cat\b|clat|cuet)/i

async function textFields(db: SupabaseClient, c: CollegeDetailRow, ai: Out, onAdmission: OnSite, onScholarship: OnSite, res: Res, opts: Opts, today: Date) {
  const fields: Record<string, Change> = {}
  const extra: Record<string, unknown> = {}
  let src: string | null = null

  // Admission process: sentences copied word for word from the admissions pages that say how admission works
  const steps = ai.admission_steps.map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length >= 25 && !NEWS.test(s) && PROCESS.test(s))
  const kept = steps.filter((s) => { const u = onAdmission(s); if (u) src ??= u; return !!u }).slice(0, 6)
  if (steps.length > kept.length) res.dropped.push(`${c.name} admission: ${steps.length - kept.length} sentence(s) not found on the site`)
  if (kept.length >= 2) {
    const text = kept.map((s) => `• ${s}`).join('\n')
    if (text !== c.admission_process) {
      fields.admission_process = { old: c.admission_process, new: text, evidence: kept[0] }
      extra.admission_source_url = src
      extra.admission_verified_at = today.toISOString()
    }
  }

  // Institute scholarships
  const schol = ai.scholarships
    .map((s) => ({ name: (s.name ?? '').trim().slice(0, 120), detail: (s.quote ?? '').replace(/\s+/g, ' ').trim().slice(0, 400), source_url: onScholarship(s.quote) }))
    // The quote must describe the scheme (who gets what), not just announce results
    .filter((s) => s.name && s.detail.length >= 40 && s.source_url && !NEWS.test(s.detail) && normalize(s.detail).includes(normalize(s.name).split(' ')[0])
      && /(waiver|amount|₹|rs\.?|per (annum|year|month|semester)|%|tuition|students? (with|from|who)|family income|merit|awarded|eligible)/i.test(s.detail))
    .slice(0, 12)
  if (schol.length && JSON.stringify(schol) !== JSON.stringify(c.institute_scholarships)) {
    fields.institute_scholarships = { old: c.institute_scholarships, new: schol, evidence: schol[0].detail }
    src ??= schol[0].source_url
  }

  // College fee range from the official programme fees just confirmed
  const { data: fees } = opts.dryRun ? { data: [] } : await db.from('college_courses').select('annual_fees_min, source_url').eq('college_id', c.id).eq('source_type', 'official').not('annual_fees_min', 'is', null)
  const amounts = (fees ?? []).map((f) => f.annual_fees_min as number)
  if (amounts.length) {
    const [min, max] = [Math.min(...amounts), Math.max(...amounts)]
    if (min !== c.annual_fees_min || max !== c.annual_fees_max) {
      fields.annual_fees_min = { old: c.annual_fees_min, new: min, evidence: 'Lowest official annual programme fee' }
      fields.annual_fees_max = { old: c.annual_fees_max, new: max, evidence: 'Highest official annual programme fee' }
      fields.fee_note = { old: null, new: `Tuition per year across ${amounts.length} programme${amounts.length > 1 ? 's' : ''}, from the official fee schedule`, evidence: null }
      extra.fees_source_url = fees![0].source_url
      extra.fees_verified_at = today.toISOString()
      src ??= fees![0].source_url
    }
  }

  if (!Object.keys(fields).length || !src) return
  res.outcomes.push(
    await submitProposal(db, opts.runId, {
      entity: 'college',
      table: 'colleges',
      recordId: c.id,
      label: `${c.name} — admission, scholarships, fee range`,
      fields,
      extra,
      sourceUrl: src,
      official: true,
      overwritesVerified: !!(c.admission_verified_at && fields.admission_process) || !!(c.fees_verified_at && fields.annual_fees_min),
    }, opts.dryRun)
  )
}
