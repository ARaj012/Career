/**
 * Official college-wise admission cutoffs (closing ranks / scores per programme
 * and category) for every exam except JEE Main/Advanced, whose ranks come from
 * JoSAA (josaa.ts). Read from the college's own website and from the exam's
 * official / counselling site (KEA, CET Cell, MCC, the NLU consortium…).
 *
 * The AI only reads. A value is kept only when its quote is on an official
 * page, contains the number, names the category, is dated, and — on a page
 * that is not the college's own — names the college. Rows this reader wrote
 * are replaced each time; JoSAA rows and hand-checked rows are never touched.
 * Old unverified rows for the same college/exam/year are then retired by
 * retire_replaced_unverified().
 */
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractJson } from './llm'
import { amountsIn, normalize } from './evidence'
import { fetchPage, hostOf, relevantLinks, type FetchedPage, type LinkFocus } from './http'
import { buildContext, gatherPages, isOfficialUrl, locateQuote, saveCache } from './sources'
import { cutoffLines, quoteNamesCategory } from './exam-cutoffs'
import { canonName } from './nirf'
import { examNamePattern } from './exams'

/** JEE ranks come from JoSAA, not from this reader. */
export const JOSAA_EXAMS = ['jee-main', 'jee-advanced']
/** `round` on every row this reader writes, so a later run can replace exactly those. */
export const OFFICIAL_NOTICE = 'Official notice'

const CUTOFF = /(cut[\s-]?off|closing|opening|last rank|allot|seat matrix|orcr|merit list|counsel|admission)/i
const CUTOFF_TEXT = /(cut[\s-]?off|closing rank|opening rank|last rank|allotment|allotted|merit)/i
const KEYWORDS = /(cut[\s-]?off|closing|opening|rank|score|percentile|marks|general|open|\bgm\b|unreserved|\bur\b|obc|\bsc\b|\bst\b|ews|pwd|pwbd|category|quota|round|branch|programme|program|course)/i

const Output = z.object({
  rows: z
    .array(
      z.object({
        exam: z.string(),
        year: z.coerce.number().int(),
        programme: z.string().nullish(),
        category: z.string(),
        quota: z.string().nullish(),
        round: z.string().nullish(),
        metric: z.string().nullish(),
        opening: z.coerce.number().nullish(),
        closing: z.coerce.number(),
        quote: z.string().nullish(),
      })
    )
    .nullish()
    .transform((v) => v ?? []),
})

export type CollegeCutoffRow = {
  id: string
  name: string
  city: string | null
  website_url: string | null
  cutoffs_read_at?: string | null
}
type ExamRef = { id: string; name: string; slug: string; official_url: string | null; source_urls: string[] | null }

export type CollegeCutoffResult = { slug: string; outcomes: never[]; skipped?: string; errors: string[]; dropped: string[]; log: string[] }

const GENERIC = new Set(['indian', 'institute', 'of', 'and', 'the', 'college', 'university', 'national', 'school', 'government', 'engineering', 'technology', 'science', 'sciences', 'medical', 'management', 'studies', 'academy', 'centre', 'center', 'deemed', 'campus'])

/** The words that tell this college apart from others on a counselling list ("Visvesvaraya", "Ramaiah"…). */
export function distinctWords(name: string, city: string | null): string[] {
  const own = canonName(name).split(' ').filter((w) => w.length >= 4 && !GENERIC.has(w))
  const cityWords = city ? canonName(city).split(' ') : []
  const named = own.filter((w) => !cityWords.includes(w))
  return named.length ? named : own
}

/** Does this text (a page, or one table row) name the college? */
export function namesCollege(text: string, words: string[]): boolean {
  if (!words.length) return false
  const t = ` ${canonName(text)} `
  const hits = words.filter((w) => t.includes(` ${w} `)).length
  return hits >= Math.min(2, words.length)
}

/** Match the AI's exam name to one of our exams ("KCET" → kcet, "NEET UG 2025" → neet-ug). */
export function matchExam(label: string, exams: ExamRef[]): ExamRef | null {
  const n = normalize(label)
  const hits = exams.filter((e) => examNamePattern(e.name).strong.test(label) || n.includes(normalize(e.slug.replace(/-/g, ' '))))
  if (hits.length === 1) return hits[0]
  // Several: the longest name that matches (NEET PG over NEET)
  return hits.sort((a, b) => b.name.length - a.name.length)[0] ?? null
}

const metricOf = (m: string | null | undefined): 'rank' | 'score' => (/rank/i.test(m ?? '') || !m ? 'rank' : 'score')

// Step 1 on the college's site: where admissions live. Step 2: the cutoff documents those pages list.
const ADMISSION_LINK = /(admission|admissions|how.?to.?apply|selection|programmes?|programs?|courses?|\bpgp\b|\bmba\b|\bpgdm\b|\bb\.?\s?tech\b|\bmbbs\b|\bllb\b|counsel|cut[\s-]?off)/i
const CUTOFF_LINK = /(cut[\s-]?off|admission.?(policy|criteria|process)|selection.?(criteria|process|policy|procedure)|closing.?rank|opening.?(and|&).?closing|merit.?list|\borcr\b|last.?rank|shortlisting.?criteria)/i
const NOISE_LINK = /(recruit|faculty|jobs?\b|career.?at|vacanc|tender|event|workshop|conference|seminar|webinar|holiday|hostel|news|gallery|alumni|executive|\bepgp\b|\bmdp\b|login|signin|ph\.?\s?d|doctoral|fellow)/i

function sameSiteLinks(p: FetchedPage, re: RegExp, max: number): string[] {
  const host = hostOf(p.finalUrl)
  return p.links
    .filter((l) => { const h = hostOf(l.url); return !!h && (h === host || h.endsWith(`.${host}`) || host.endsWith(`.${h}`)) })
    .filter((l) => !/^(mailto|tel|javascript):/i.test(l.url) && re.test(`${l.text} ${safeDecode(l.url)}`) && !NOISE_LINK.test(`${l.text} ${l.url}`))
    // Cutoff documents (often PDFs) first
    .sort((a, b) => Number(CUTOFF_LINK.test(`${b.text} ${b.url}`)) - Number(CUTOFF_LINK.test(`${a.text} ${a.url}`)) || Number(/\.pdf($|\?)/i.test(b.url)) - Number(/\.pdf($|\?)/i.test(a.url)))
    .map((l) => l.url.split('#')[0])
    .filter((u, i, all) => all.indexOf(u) === i)
    .slice(0, max)
}
const safeDecode = (u: string) => { try { return decodeURIComponent(u) } catch { return u } }

/** Home page → admission pages → the cutoff documents they link to, plus cutoff pages in the sitemap. */
async function crawlOwnSite(home: string): Promise<{ pages: FetchedPage[]; errors: string[] }> {
  const pages: FetchedPage[] = []
  const errors: string[] = []
  const seen = new Set<string>()
  const get = async (url: string) => {
    if (seen.has(url) || pages.length >= 14) return null
    seen.add(url)
    try { const p = await fetchPage(url); pages.push(p); return p } catch (err) { errors.push((err as Error).message); return null }
  }
  const root = await get(home)
  if (!root) return { pages, errors }
  const level1 = sameSiteLinks(root, ADMISSION_LINK, 6)
  const fromSitemap: string[] = []
  try {
    const xml = (await fetchPage(new URL('/sitemap.xml', home).toString())).text
    const host = hostOf(home)
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
      if (hostOf(m[1]).endsWith(host) && CUTOFF_LINK.test(safeDecode(m[1])) && !NOISE_LINK.test(m[1])) fromSitemap.push(m[1])
    }
  } catch { /* no sitemap */ }
  for (const url of fromSitemap.slice(0, 3)) await get(url)
  const admission: FetchedPage[] = []
  for (const url of level1) { const p = await get(url); if (p && p.kind === 'html') admission.push(p) }
  for (const p of admission) for (const url of sameSiteLinks(p, CUTOFF_LINK, 3)) await get(url)
  return { pages, errors }
}

/** True when any page differs from what the page cache holds (or was never read). */
async function pagesChanged(db: SupabaseClient, pages: FetchedPage[]): Promise<boolean> {
  if (!pages.length) return false
  const { data } = await db.from('automation_page_cache').select('url, content_hash').in('url', pages.map((p) => p.url))
  const map = new Map((data ?? []).map((c) => [c.url, c.content_hash]))
  return pages.some((p) => map.get(p.url) !== p.hash)
}

export async function updateCollegeCutoffs(
  db: SupabaseClient,
  college: CollegeCutoffRow,
  opts: { dryRun: boolean; force: boolean; today?: Date }
): Promise<CollegeCutoffResult> {
  const today = opts.today ?? new Date()
  const Y = today.getFullYear()
  const res: CollegeCutoffResult = { slug: college.name, outcomes: [], errors: [], dropped: [], log: [] }
  if (!college.website_url) return { ...res, skipped: 'no website' }

  // Exams this college admits through (from the cutoffs on file), except JEE (JoSAA)
  const { data: linked } = await db.from('college_exam_cutoffs').select('exam_id').eq('college_id', college.id)
  const ids = [...new Set((linked ?? []).map((r) => r.exam_id as string))]
  const { data: allExams } = await db.from('exams').select('id, name, slug, official_url, source_urls')
  const exams = ((allExams ?? []) as ExamRef[]).filter((e) => !JOSAA_EXAMS.includes(e.slug))
  const known = exams.filter((e) => ids.includes(e.id))
  if (ids.length && !known.length) return { ...res, skipped: 'JEE cutoffs come from JoSAA' }

  // The college's own site, plus each known exam's official / counselling site, looking for this college
  const words = distinctWords(college.name, college.city)
  const nameRe = words.length ? new RegExp(words.map((w) => `\\b${w}\\b`).join('|'), 'i') : undefined
  const ownHost = hostOf(college.website_url)
  const focus: LinkFocus = { strong: nameRe ?? /$^/, ownHost }
  const own = await crawlOwnSite(college.website_url)
  res.errors.push(...own.errors)
  const pages: FetchedPage[] = [...own.pages]
  let changed = await pagesChanged(db, own.pages)
  for (const e of known.slice(0, 3)) {
    const urls = [e.official_url, ...(e.source_urls ?? [])].filter(Boolean) as string[]
    if (!urls.length) continue
    const g = await gatherPages(db, urls.slice(0, 2), 3, CUTOFF, { strong: nameRe ?? /$^/, weak: examNamePattern(e.name).strong })
    res.errors.push(...g.errors)
    pages.push(...g.pages)
    changed ||= g.changed
  }
  // One more hop from cutoff pages to the documents they list (PDF rank lists)
  const seen = new Set(pages.map((p) => p.url))
  for (const p of pages.filter((p) => p.kind === 'html' && CUTOFF.test(`${p.url} ${p.text.slice(0, 400)}`))) {
    for (const url of relevantLinks(p, 2, CUTOFF, focus)) {
      if (seen.has(url) || pages.length >= 14) continue
      seen.add(url)
      try { pages.push(await fetchPage(url)) } catch (err) { res.errors.push((err as Error).message) }
    }
  }

  const officialUrls = [college.website_url, ...known.flatMap((e) => [e.official_url, ...(e.source_urls ?? [])])]
  const isHome = (url: string) => { try { return new URL(url).pathname.replace(/\/(index\.\w+)?$/, '') === '' } catch { return true } }
  const onOwnSite = (url: string) => { const h = hostOf(url); return h === ownHost || h.endsWith(`.${ownHost}`) }
  const usable = pages.filter((p) =>
    !isHome(p.finalUrl) && isOfficialUrl(p.finalUrl, officialUrls) && CUTOFF_TEXT.test(p.text) && cutoffLines(p.text) >= 2 &&
    (onOwnSite(p.finalUrl) || namesCollege(p.text, words)))
  if (process.env.AUTOMATION_DEBUG) {
    for (const p of pages) {
      const why = isHome(p.finalUrl) ? 'home page' : !isOfficialUrl(p.finalUrl, officialUrls) ? 'not official' : !CUTOFF_TEXT.test(p.text) ? 'no cutoff words'
        : cutoffLines(p.text) < 2 ? 'no category/number lines' : !(onOwnSite(p.finalUrl) || namesCollege(p.text, words)) ? 'does not name the college' : 'USED'
      console.log(`    📄 ${why.padEnd(26)} ${p.finalUrl}`)
    }
  }
  if (!usable.length) return { ...res, skipped: 'no official cutoff list for this college found' }
  if (!changed && college.cutoffs_read_at && !opts.force) return { ...res, skipped: 'official pages unchanged since last run' }

  const examList = (known.length ? known : exams).map((e) => e.name)
  const task = `College: "${college.name}"${college.city ? `, ${college.city}` : ''}. Today is ${today.toISOString().slice(0, 10)}.
Report the OFFICIAL ADMISSION CUTOFFS of THIS college stated in the text for the years ${Y - 4} to ${Y}: for each programme and category, the last (closing) rank or score that got a seat.
${known.length ? `This college admits through: ${examList.join('; ')}.` : 'Name the entrance exam exactly as the text does.'}
For each value: exam (name of the entrance exam), year (admission year), programme (as written, e.g. "B.E. Computer Science"; null if not split by programme), category exactly as written (e.g. "GM", "OPEN", "UR", "OBC-NCL", "SC", "ST", "EWS", "2AG"), quota (e.g. "All India", "Home State", "Karnataka"; null if none), round (e.g. "Round 3", "Final"; null if not stated), metric = "rank", "score", "percentile" or "marks", opening = opening rank/score if stated, closing = the closing rank/score exactly as written.
quote = the text containing the category AND the number, copied exactly (for a table, the whole table row, including the college name or code if the row has one).
Only rows for "${college.name}" — never other colleges on the same list. Do not report seat counts, fees, or toppers. If nothing is stated, return {"rows":[]}.
JSON: {"rows":[{"exam":"…","year":${Y},"programme":"…","category":"GM","quota":null,"round":null,"metric":"rank","opening":null,"closing":1234,"quote":"…"}]}`

  const context = buildContext(usable.slice(0, 6), KEYWORDS, 14_000)
  const ai = await extractJson(task, context, Output)
  if (!ai) return { ...res, skipped: 'AI could not read the cutoff list' }
  if (!opts.dryRun) {
    await saveCache(db, pages)
    await db.from('colleges').update({ cutoffs_read_at: today.toISOString() }).eq('id', college.id)
  }

  const normCache = new Map<string, string>()
  const groups = new Map<string, { examId: string; year: number; rows: Record<string, unknown>[] }>()
  for (const r of ai.rows) {
    const label = `${college.name} ${r.exam} ${r.year} ${r.category}`
    if (r.year < Y - 4 || r.year > Y) continue
    const exam = matchExam(r.exam, known.length ? known : exams)
    if (!exam) { res.dropped.push(`${label}: exam not recognised`); continue }
    const url = locateQuote(r.quote, usable, normCache)
    if (!url) { res.dropped.push(`${label}: quote not on an official page`); continue }
    if (!amountsIn(r.quote!).includes(r.closing)) { res.dropped.push(`${label}: quote does not contain ${r.closing}`); continue }
    if (!quoteNamesCategory(r.category, r.quote!) && !normalize(r.quote!).includes(normalize(r.category))) { res.dropped.push(`${label}: quote does not name the category`); continue }
    // A counselling list covers many colleges: its row must name this one
    if (!onOwnSite(url) && !namesCollege(r.quote!, words)) { res.dropped.push(`${label}: row does not name the college`); continue }
    const page = usable.find((p) => p.finalUrl === url)!
    const heading = `${page.finalUrl} ${page.text.slice(0, 1500)}`
    const headingYears = new Set([...heading.matchAll(/\b(20\d\d)\b/g)].map((m) => Number(m[1])).filter((y) => y >= Y - 5 && y <= Y + 1))
    if (!r.quote!.includes(String(r.year)) && !(headingYears.size === 1 && headingYears.has(r.year))) { res.dropped.push(`${label}: year not stated next to the value`); continue }
    if (/percentile/i.test(r.metric ?? '') && (r.closing < 0 || r.closing > 100)) { res.dropped.push(`${label}: percentile out of range`); continue }

    const rank = metricOf(r.metric) === 'rank'
    const key = `${exam.id}|${r.year}`
    const g = groups.get(key) ?? { examId: exam.id, year: r.year, rows: [] }
    g.rows.push({
      college_id: college.id, exam_id: exam.id, year: r.year,
      program_name: r.programme?.trim().slice(0, 200) || null,
      category: r.category.trim().slice(0, 60),
      quota: r.quota?.trim().slice(0, 40) || null,
      round: r.round ? `${r.round.trim().slice(0, 40)} · ${OFFICIAL_NOTICE}` : OFFICIAL_NOTICE,
      cutoff_rank: rank ? Math.round(r.closing) : null,
      opening_rank: rank && r.opening != null ? Math.round(r.opening) : null,
      cutoff_score: rank ? null : r.closing,
      source_type: 'official', source_url: url,
    })
    groups.set(key, g)
  }

  for (const { examId, year, rows } of groups.values()) {
    const unique = [...new Map(rows.map((r) => [`${r.program_name}|${r.category}|${r.quota}|${r.round}`, r])).values()]
    res.log.push(`${college.name} ${year}: ${unique.length} official cutoffs`)
    if (opts.dryRun) continue
    // Replace only the rows this reader wrote for this college, exam and year
    const del = await db.from('college_exam_cutoffs').delete()
      .eq('college_id', college.id).eq('exam_id', examId).eq('year', year).eq('source_type', 'official').like('round', `%${OFFICIAL_NOTICE}`)
    if (del.error) { res.errors.push(`${college.name} ${year}: ${del.error.message}`); continue }
    const ins = await db.from('college_exam_cutoffs').insert(unique)
    if (ins.error) res.errors.push(`${college.name} ${year}: ${ins.error.message}`)
  }
  if (!groups.size) res.log.push(`${college.name}: no cutoff confirmed on the official pages`)
  return res
}
