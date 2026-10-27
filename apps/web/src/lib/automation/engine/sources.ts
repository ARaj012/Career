import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPage, focusText, hostOf, relevantLinks, type FetchedPage, type LinkFocus } from './http'
import { normalize, quoteOnPage } from './evidence'

const AGGREGATORS = /(shiksha|careers360|collegedunia|collegedekho|jagranjosh|testbook|adda247|buddy4study|aglasem|cracku|embibe|byjus|vedantu|wikipedia)\./i
const OFFICIAL_SUFFIX = /\.(gov\.in|nic\.in|ac\.in|edu\.in|res\.in|edu|gov)$/i

/** Official = one of the record's own domains, or a government/academic domain. */
export function isOfficialUrl(url: string, ownUrls: (string | null | undefined)[]): boolean {
  const h = hostOf(url)
  if (!h || AGGREGATORS.test(h)) return false
  const own = ownUrls.map((u) => (u ? hostOf(u) : '')).filter(Boolean)
  if (own.some((o) => h === o || h.endsWith(`.${o}`) || o.endsWith(`.${h}`))) return true
  return OFFICIAL_SUFFIX.test(h)
}

export type Gathered = {
  pages: FetchedPage[]
  changed: boolean
  errors: string[]
}

/**
 * Fetch the record's official pages plus a few linked notice/bulletin pages.
 * `changed` is false when every page has the same content as last run.
 */
export async function gatherPages(
  db: SupabaseClient | null,
  startUrls: string[],
  followLinks = 3,
  linkHint?: RegExp,
  focus?: LinkFocus
): Promise<Gathered> {
  const pages: FetchedPage[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  const queue = [...new Set(startUrls.filter(Boolean))]
  for (const url of queue) {
    if (seen.has(url)) continue
    seen.add(url)
    try {
      const p = await fetchPage(url)
      pages.push(p)
      if (pages.length === 1 && followLinks > 0) {
        for (const l of relevantLinks(p, followLinks, linkHint, focus)) if (!seen.has(l)) queue.push(l)
      }
    } catch (err) {
      errors.push((err as Error).message)
    }
  }

  let changed = true
  if (db && pages.length) {
    const { data: cached } = await db
      .from('automation_page_cache')
      .select('url, content_hash')
      .in('url', pages.map((p) => p.url))
    const map = new Map((cached ?? []).map((c) => [c.url, c.content_hash]))
    changed = pages.some((p) => map.get(p.url) !== p.hash)
  }
  return { pages, changed, errors }
}

export async function saveCache(db: SupabaseClient, pages: FetchedPage[]) {
  if (!pages.length) return
  await db.from('automation_page_cache').upsert(
    pages.map((p) => ({ url: p.url, content_hash: p.hash, fetched_at: new Date().toISOString(), http_status: p.status, last_error: null }))
  )
}

/** Build one labelled text blob for the AI, keeping only date-relevant lines. */
export function buildContext(pages: FetchedPage[], keywords: RegExp, budget = 12_000): string {
  const per = Math.max(2500, Math.floor(budget / Math.max(1, pages.length)))
  return pages
    .map((p, i) => `### SOURCE ${i + 1}: ${p.finalUrl}\n${focusText(p.text, keywords, per)}`)
    .join('\n\n')
    .slice(0, budget)
}

/** Which fetched page contains this quote? Returns its URL, or null if none (= hallucinated). */
export function locateQuote(quote: string | null | undefined, pages: FetchedPage[], normCache: Map<string, string>): string | null {
  if (!quote) return null
  for (const p of pages) {
    let n = normCache.get(p.url)
    if (n === undefined) {
      n = normalize(p.text)
      normCache.set(p.url, n)
    }
    if (quoteOnPage(quote, n)) return p.finalUrl
  }
  return null
}
