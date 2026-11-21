/**
 * Previous-year question papers and answer keys, read from each exam's official
 * website. No AI: it reads the links on the exam's own pages (and the archive
 * pages they point to) and keeps the ones that are question papers, answer keys
 * or official sample papers. Only the links are stored — the files stay on the
 * official site, so students always open the board's own copy.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPage, hostOf, type FetchedPage, type LinkFocus } from './http'
import { examFocus, examNamePattern } from './exams'

export type PaperKind = 'question_paper' | 'answer_key' | 'sample_paper'

export interface FoundPaper {
  url: string
  title: string
  kind: PaperKind
  year: number | null
  source_url: string
}

/**
 * Official pages that list an exam's past papers but aren't linked in a way the
 * reader can find from the home page. Each was checked by hand on the official site.
 */
export const ARCHIVE_PAGES: Record<string, string[]> = {
  'jee-advanced': ['https://jeeadv.ac.in/archive.html'],
  'cmi-entrance': ['https://www.cmi.ac.in/admissions/syllabus.php'],
}

const DOCUMENT = /\.(pdf|docx?|zip)(\?|#|$)|\/uploads\/|\/download\//i
const PAPER =
  /question\s*(paper|booklet)|\bq\.?\s?p\.?\b|past[_\s-]*(paper|qp)|previous\s*(year)?\s*(question|paper)|old\s*paper|\bpaper[\s_-]*(i{1,3}|[1-3])\b|answer[\s_-]*keys?|\bsolutions?\b|sample[\s_-]*(question[\s_-]*)?paper|model\s*(question\s*)?paper|past_qps/i
// Notices *about* papers (dates to challenge a key, re-exams…) are not papers
const NOT_PAPER =
  /\b(challenge|empanel|advertis|admit card|result|syllabus|schedule|instruction|cancel|re-?conduct|corrigendum|extension|tender|recruitment|vacanc|notice for|regarding|reg\.)/i
// Never a paper, even when it mentions a final key
const NEVER_PAPER =
  /\b(notice|clarification|pattern|normali[sz]ation|declaration|declares|provisional|score\s*card|duration|faculty|contractual|recruitment|ph\.?\s?d)\b/i
const FINAL_KEY = /final\s*answer\s*keys?/i
// On a shared board a link must say what it is ("Paper-1 (B.E.)" alone is a result notice there)
const EXPLICIT = /question\s*(paper|booklet)|answer\s*keys?|\bq\.?p\b|solutions?|sample|model\s*paper/i

// Capitalised words that are not exam names
const COMMON = new Set(('PAPER PAPERS FINAL ANSWER ANSWERS KEYS QUESTION QUESTIONS SHIFT URDU HINDI ENGLISH SESSION EXAM ' +
  'EXAMS EXAMINATION HELD SAMPLE MODEL PART SECTION DATED BOOKLET SERIES TEST ENTRANCE SOLUTION SOLUTIONS DOWNLOAD ' +
  'JANUARY FEBRUARY MARCH APRIL JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER DECEMBER WITH FROM THAT THIS BTECH TECH ' +
  'ARCH PLANNING GENERAL STUDIES APTITUDE PHYSICS CHEMISTRY MATHEMATICS BIOLOGY').split(' '))

/**
 * An exam acronym in the link that isn't this exam's (JELET on the WBJEE board's
 * site, NHTET on NCHM's): the paper belongs to another exam the board runs.
 */
export function namesOtherExam(text: string, examName: string, slug: string): boolean {
  const ours = new Set([...examName.toUpperCase().split(/[^A-Z0-9]+/), ...slug.toUpperCase().split('-')])
  for (const m of text.matchAll(/\b[A-Z]{4,}\b/g)) {
    const w = m[0]
    if (COMMON.has(w) || ours.has(w) || [...ours].some((o) => o.length >= 4 && (o.includes(w) || w.includes(o)))) continue
    return true
  }
  return false
}
const ARCHIVE_LINK =
  /previous|past\s*(paper|year)|old\s*(question\s*)?paper|question\s*(paper|booklet)s?|archive|answer\s*keys?|\bqp\b|download/i

/** What a link is: its text decides; the file name only when the text says nothing. */
export function paperKind(text: string, url = ''): PaperKind {
  const key = /answer[\s_-]*keys?|\bkeys?\b|solution/i
  const sample = /sample|model\s*(question\s*)?paper|specimen|mock/i
  if (key.test(text)) return 'answer_key'
  if (sample.test(text)) return 'sample_paper'
  if (/question|paper|\bqp\b/i.test(text)) return 'question_paper'
  if (key.test(url)) return 'answer_key'
  if (sample.test(url)) return 'sample_paper'
  return 'question_paper'
}

/** The exam year a paper is from: in its title first, then in its file name. */
export function paperYear(text: string, url: string, now = new Date()): number | null {
  const max = now.getFullYear() + 1
  const ok = (y: number) => y >= 2000 && y <= max
  for (const m of text.matchAll(/\b(20\d{2})\b/g)) if (ok(+m[1])) return +m[1]
  let file = ''
  try { file = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '') } catch {}
  // "2007_1.pdf", "QP-2024-GS.pdf" — but not upload stamps like "202606231857909583.pdf"
  const m = file.match(/(?:^|[^0-9])(20\d{2})(?=[^0-9]|$)/)
  if (m && ok(+m[1])) return +m[1]
  return null
}

const safeDecode = (u: string) => { try { return decodeURIComponent(u) } catch { return u } }

const GENERIC = /^(download|click here|view|pdf|link|here|open)$/i

export function paperTitle(text: string, kind: PaperKind, year: number | null, url = ''): string {
  const t = text.replace(/\b(read more|click here|download)\b/gi, ' ').replace(/[[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  const lang = /english/i.test(url) && !/english/i.test(t) ? ' · English' : /hindi/i.test(url) && !/hindi/i.test(t) ? ' · Hindi' : ''
  if (t && !GENERIC.test(t) && t.length > 3) return (t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 160) + lang
  const label = kind === 'answer_key' ? 'Answer key' : kind === 'sample_paper' ? 'Sample paper' : 'Question paper'
  return year ? `${label} ${year}` : label
}

/**
 * Is this link a paper for this exam? On a shared notice board (nta.ac.in,
 * upsc.gov.in) the link must name the exam; on the exam's own site or a
 * hand-checked archive page every paper link counts.
 */
export function classifyPaperLink(
  link: { url: string; text: string },
  opts: { focus: LinkFocus; trusted: boolean; officialHosts: string[]; others?: RegExp[]; exam?: { name: string; slug: string } },
  now = new Date(),
): FoundPaper | null {
  const blob = `${link.text} ${link.url}`
  if (!DOCUMENT.test(link.url)) return null
  if (!PAPER.test(blob)) return null
  if (NEVER_PAPER.test(link.text)) return null
  // A bare date ("08/04/2026") says neither what it is nor which exam it's for
  if (!/[a-z]{3,}/i.test(link.text.replace(/\b(read more|click here|download|view|pdf)\b/gi, ''))) return null
  if (NOT_PAPER.test(link.text) && !FINAL_KEY.test(link.text)) return null
  if (!opts.trusted && !EXPLICIT.test(link.text)) return null
  const h = hostOf(link.url)
  const official = opts.officialHosts.some((o) => h === o || h.endsWith(`.${o}`) || o.endsWith(`.${h}`)) ||
    /(^|\.)s3waas\.gov\.in$/.test(h) // gov.in sites (NTA, state boards) serve their uploads from here
  if (!official) return null
  if (!opts.trusted) {
    const strong = opts.focus.strong.test(link.text) || opts.focus.strong.test(safeDecode(link.url))
    if (!strong && !opts.focus.weak?.test(link.text)) return null
    // "CUET" alone also names CUET (UG): a link naming a sibling exam in full is theirs
    if (!strong && opts.others?.some((re) => re.test(link.text))) return null
    if (!strong && opts.exam && namesOtherExam(link.text, opts.exam.name, opts.exam.slug)) return null
  } else {
    const named = opts.focus.strong.test(link.text) || !!opts.focus.weak?.test(link.text)
    if (!named && opts.exam && namesOtherExam(link.text, opts.exam.name, opts.exam.slug)) return null
  }
  const kind = paperKind(link.text, link.url)
  const year = paperYear(link.text, link.url, now)
  return { url: link.url, title: paperTitle(link.text, kind, year, link.url), kind, year, source_url: '' }
}

let allExams: Promise<{ id: string; name: string }[]> | null = null
/** Full-name patterns of every other exam (to tell CUET UG's papers from CUET PG's). */
async function otherExamNames(db: SupabaseClient, id: string): Promise<RegExp[]> {
  allExams ??= Promise.resolve(db.from('exams').select('id, name')).then(({ data }) => (data ?? []) as { id: string; name: string }[])
  return (await allExams).filter((e) => e.id !== id).map((e) => examNamePattern(e.name).strong)
}

type PaperExam = { id: string; name: string; slug: string; official_url: string | null; source_urls: string[] | null }

/** Read an exam's official pages (two levels deep) for paper links. */
export async function findPapers(db: SupabaseClient, exam: PaperExam, log: (m: string) => void = () => {}, read: Set<string> = new Set()): Promise<FoundPaper[]> {
  if (!exam.official_url) return []
  const focus = await examFocus(db, exam)
  const others = await otherExamNames(db, exam.id)
  const officialHosts = [exam.official_url, ...(exam.source_urls ?? []), ...(ARCHIVE_PAGES[exam.slug] ?? [])].map(hostOf).filter(Boolean)
  const seeds = ARCHIVE_PAGES[exam.slug] ?? []
  const start = [...new Set([exam.official_url, ...(exam.source_urls ?? []).filter((u) => officialHosts.includes(hostOf(u))), ...seeds])]

  const found = new Map<string, FoundPaper>()
  const visited = new Set<string>()
  const queue: { url: string; trusted: boolean; depth: number }[] = start.map((url) => ({
    url, depth: 0, trusted: seeds.includes(url) || (!!focus.ownHost && hostOf(url) === focus.ownHost),
  }))

  while (queue.length && visited.size < 8) {
    const { url, trusted, depth } = queue.shift()!
    if (visited.has(url)) continue
    visited.add(url)
    let page: FetchedPage
    try {
      page = await fetchPage(url)
    } catch (err) {
      log(`  ${exam.slug}: ${(err as Error).message}`)
      continue
    }
    if (page.kind !== 'html') continue
    read.add(page.finalUrl)

    for (const link of page.links) {
      const p = classifyPaperLink(link, { focus, trusted, officialHosts, others, exam })
      if (p && !found.has(p.url)) found.set(p.url, { ...p, source_url: page.finalUrl })
    }

    // Archive pages one level down, on the same official site, best first
    if (depth >= 1) continue
    const next = page.links
      .filter((l) => !DOCUMENT.test(l.url) && ARCHIVE_LINK.test(`${l.text} ${l.url}`) && !NOT_PAPER.test(l.text))
      .filter((l) => officialHosts.includes(hostOf(l.url)) && !/facebook|twitter|linkedin|x\.com|whatsapp/i.test(l.url))
      .map((l) => {
        const names = focus.strong.test(l.text) || !!focus.weak?.test(l.text)
        const score = (names ? 4 : 0) + (/previous|past|old|question/i.test(l.text) ? 3 : 0) + (/archive|answer/i.test(l.text) ? 1 : 0)
        return { l, names, score }
      })
      .filter((x) => trusted || x.names || x.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
    for (const { l, names } of next) queue.push({ url: l.url, depth: depth + 1, trusted: trusted || names && /previous|past|old|question/i.test(l.text) })
  }

  // Most recent first; keep it to what a student will use
  return [...found.values()]
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 80)
}

export type PapersResult = { slug: string; found: number; added: number; removed: number; errors: string[] }

/**
 * Store new paper links. A stored link is removed only when the page it came from
 * was read again and no longer lists it (the board took it down, or it never was a paper).
 */
export async function updatePapers(db: SupabaseClient, exam: PaperExam, dryRun = false): Promise<PapersResult> {
  const errors: string[] = []
  const read = new Set<string>()
  const papers = await findPapers(db, exam, (m) => errors.push(m), read)
  let added = 0
  let removed = 0
  if (!dryRun && read.size) {
    const keep = new Set(papers.map((p) => p.url))
    const { data: stored } = await db.from('exam_papers').select('id, url, source_url').eq('exam_id', exam.id)
    const gone = (stored ?? []).filter((r) => !keep.has(r.url) && read.has(r.source_url ?? ''))
    if (gone.length) {
      const { error } = await db.from('exam_papers').delete().in('id', gone.map((r) => r.id))
      if (error) errors.push(error.message)
      else removed = gone.length
    }
  }
  if (!dryRun && papers.length) {
    const { data: existing } = await db.from('exam_papers').select('url').eq('exam_id', exam.id)
    const known = new Set((existing ?? []).map((r) => r.url as string))
    const now = new Date().toISOString()
    const rows = papers.map((p) => ({ exam_id: exam.id, url: p.url, title: p.title, kind: p.kind, year: p.year, source_url: p.source_url, last_seen_at: now }))
    const { error } = await db.from('exam_papers').upsert(rows, { onConflict: 'exam_id,url' })
    if (error) errors.push(error.message)
    else added = papers.filter((p) => !known.has(p.url)).length
  }
  if (!dryRun) await db.from('exams').update({ papers_checked_at: new Date().toISOString() }).eq('id', exam.id)
  return { slug: exam.slug, found: papers.length, added, removed, errors }
}
