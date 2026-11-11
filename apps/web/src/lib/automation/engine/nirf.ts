/**
 * NIRF rankings from nirfindia.org (Ministry of Education).
 * Deterministic parsing — no AI. Columns are located by header text,
 * not by position, so a reordered table still parses or fails loudly.
 *
 * Only numeric ranks (top-100/200 pages) are used; rank-band pages
 * ("101-150") give no exact rank and are ignored.
 */
import * as cheerio from 'cheerio'
import type { SupabaseClient } from '@supabase/supabase-js'
import { USER_AGENT } from './http'
import { submitProposal, type ProposalOutcome } from './proposals'

const CATEGORIES = [
  'Overall', 'Engineering', 'Management', 'Medical', 'University', 'College',
  'Law', 'Pharmacy', 'Architecture', 'Dental', 'Research', 'Agriculture',
] as const
type Category = (typeof CATEGORIES)[number]

/** A ranked institute: a numbered rank, or (beyond the numbered list) a band such as "101-150". */
export type NirfEntry = { name: string; city: string; state: string; rank: number | null; band?: string; score: number | null }

/**
 * A near-match of names. NIRF's name may be longer ("Pandit Dwarka Prasad Mishra IIITDM Jabalpur"),
 * but when ours is longer the extra words may only be the city: "BHU Faculty of Law" is not "BHU".
 */
export function looseNameMatch(ours: string, nirf: string, city: string | null): boolean {
  const a = canonName(ours)
  const b = canonName(nirf)
  if (b.includes(a)) return true
  if (!a.includes(b)) return false
  const extra = a.replace(b, ' ').split(' ').filter(Boolean)
  const place = canonName(city ?? '')
  return extra.every((w) => place.includes(w))
}

/** One entry per institute: a page that repeats the same row in several tables counts it once. */
export function dedupe(rows: NirfEntry[]): NirfEntry[] {
  const seen = new Set<string>()
  return rows.filter((r) => {
    const k = `${r.name}|${r.city}|${r.rank}|${r.band ?? ''}`
    return !seen.has(k) && !!seen.add(k)
  })
}

/** NIRF publishes institutes beyond the numbered list on band pages: {Category}Ranking150.html etc. */
const BAND_PAGES: [string, string][] = [['150', '101-150'], ['200', '151-200'], ['300', '201-300']]

const ABBR: [RegExp, string][] = [
  [/\biiit\b/g, 'indian institute of information technology'],
  [/\biit\b/g, 'indian institute of technology'],
  [/\bnit\b/g, 'national institute of technology'],
  [/\biim\b/g, 'indian institute of management'],
  [/\biiser\b/g, 'indian institute of science education and research'],
  [/\biisc\b/g, 'indian institute of science'],
  [/\baiims\b/g, 'all india institute of medical sciences'],
  [/\bnlsiu\b/g, 'national law school of india university'],
  [/\bbhu\b/g, 'banaras hindu university'],
  [/\bjnu\b/g, 'jawaharlal nehru university'],
  [/\bbits\b/g, 'birla institute of technology and science'],
  [/\btrichy\b/g, 'tiruchirappalli'],
]

export function canonName(name: string): string {
  let s = ` ${name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ')} `
  for (const [re, full] of ABBR) s = s.replace(re, full)
  return s.replace(/\bthe\b/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Rows of a NIRF ranking table. A band page has no rank column: pass its band ("101-150"). */
export function parseNirfTable(html: string, band?: string): NirfEntry[] {
  const $ = cheerio.load(html)
  const out: NirfEntry[] = []
  $('table').each((_, table) => {
    const $t = $(table)
    const headers = $t
      .find('thead tr')
      .first()
      .find('th, td')
      .map((__, h) => $(h).text().trim().toLowerCase())
      .get()
    const idx = (re: RegExp) => headers.findIndex((h) => re.test(h))
    const iName = idx(/^name/), iCity = idx(/city/), iState = idx(/state/), iRank = idx(/^rank/), iScore = idx(/score/)
    if (iName < 0 || (iRank < 0 && !band)) return

    $t.children('tbody').children('tr').each((__, tr) => {
      const cells = $(tr).children('td')
      if (cells.length <= Math.max(iName, iRank)) return
      const cell = (i: number) => (i < 0 ? '' : $(cells[i]).clone().find('table, div').remove().end().text().replace(/\s+/g, ' ').trim())
      const rankText = iRank < 0 ? '' : cell(iRank)
      if (iRank >= 0 && !/^\d+$/.test(rankText)) return // a band in the rank column is read from its band page
      const name = cell(iName).split(/more details/i)[0].trim()
      if (!name) return
      out.push({
        name,
        city: cell(iCity),
        state: cell(iState),
        rank: iRank < 0 ? null : Number(rankText),
        ...(iRank < 0 && band ? { band } : {}),
        score: iScore >= 0 ? Number(cell(iScore)) || null : null,
      })
    })
  })
  return out
}

async function fetchPage(url: string, band?: string): Promise<NirfEntry[] | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) return null
    const rows = parseNirfTable(await res.text(), band)
    return rows.length ? rows : null
  } catch {
    return null
  } finally {
    await new Promise((r) => setTimeout(r, 2500))
  }
}

/** The numbered list of a category; with bands, also the 101-150 / 151-200 / 201-300 pages. */
async function fetchCategory(year: number, cat: Category, bands = false): Promise<NirfEntry[] | null> {
  const base = `https://www.nirfindia.org/Rankings/${year}/${cat}Ranking`
  const rows = await fetchPage(`${base}.html`)
  if (!rows || !bands) return rows
  for (const [page, band] of BAND_PAGES) rows.push(...((await fetchPage(`${base}${page}.html`, band)) ?? []))
  return rows
}

function preferredCategories(name: string, current: string | null): Category[] {
  const n = name.toLowerCase()
  const first: Category[] = []
  if (current && (CATEGORIES as readonly string[]).includes(current)) first.push(current as Category)
  if (/technology|engineering|polytechnic/.test(n)) first.push('Engineering')
  if (/management|business/.test(n)) first.push('Management')
  if (/medical|aiims|medicine/.test(n)) first.push('Medical')
  if (/law|legal|juridical/.test(n)) first.push('Law')
  if (/pharma/.test(n)) first.push('Pharmacy')
  if (/dental/.test(n)) first.push('Dental')
  if (/university/.test(n)) first.push('University')
  if (/college/.test(n)) first.push('College')
  return [...new Set([...first, 'Overall', ...CATEGORIES])] as Category[]
}

export async function updateNirf(
  db: SupabaseClient,
  opts: { runId: string | null; dryRun: boolean; today?: Date }
): Promise<{ year: number | null; matched: number; outcomes: ProposalOutcome[]; errors: string[] }> {
  const Y = (opts.today ?? new Date()).getFullYear()
  const errors: string[] = []

  // Find the latest published year
  let year: number | null = null
  for (const y of [Y, Y - 1]) {
    if (await fetchCategory(y, 'Engineering')) { year = y; break }
  }
  if (!year) return { year: null, matched: 0, outcomes: [], errors: ['NIRF ranking pages not reachable or format changed'] }

  const lists = new Map<Category, NirfEntry[]>()
  for (const c of CATEGORIES) {
    const rows = await fetchCategory(year, c, true)
    if (rows) lists.set(c, rows)
    else errors.push(`NIRF ${year} ${c}: no rows parsed`)
  }

  const { data: colleges } = await db.from('colleges').select('id, name, city, nirf_rank, nirf_band, nirf_note, nirf_year, nirf_category')
  const outcomes: ProposalOutcome[] = []
  let matched = 0

  for (const col of colleges ?? []) {
    if (col.nirf_year && col.nirf_year > year) continue
    const canon = canonName(col.name)
    let hit: { cat: Category; e: NirfEntry; exact: boolean } | null = null

    // A numbered rank in any category comes before a band (101-150 ...) in another
    for (const numbered of [true, false]) {
      for (const cat of preferredCategories(col.name, col.nirf_category)) {
        // Some pages repeat each institute in several tables (University lists it six times)
        const rows = dedupe(lists.get(cat)?.filter((r) => (r.rank !== null) === numbered) ?? [])
        if (!rows.length) continue
        const exact = rows.filter((r) => canonName(r.name) === canon)
        if (exact.length === 1) { hit = { cat, e: exact[0], exact: true }; break }
        const cityOk = (r: NirfEntry) => !!col.city && r.city.toLowerCase().includes(col.city.toLowerCase())
        const loose = rows.filter((r) => cityOk(r) && looseNameMatch(col.name, r.name, col.city))
        if (loose.length === 1) { hit = { cat, e: loose[0], exact: false }; break }
      }
      if (hit) break
    }
    if (!hit) {
      // A rank with no year was typed by hand: if NIRF does not list the institute, it is not a NIRF rank
      if (col.nirf_rank && !col.nirf_year) {
        outcomes.push(
          await submitProposal(db, opts.runId, {
            entity: 'college',
            table: 'colleges',
            recordId: col.id,
            label: `${col.name} — not in the NIRF ${year} rankings`,
            fields: { nirf_rank: { old: col.nirf_rank, new: null, evidence: null } },
            sourceUrl: `https://www.nirfindia.org/Rankings/${year}/OverallRanking.html`,
            official: true,
            overwritesVerified: false,
            forceReview: `No exact NIRF ${year} rank found under this name; check the lists before removing #${col.nirf_rank}`,
          }, opts.dryRun)
        )
      }
      continue
    }
    matched++
    const band = hit.e.band ?? null
    // A band never replaces a numbered rank from the same edition
    if (band && col.nirf_rank && col.nirf_year === year) continue
    if (col.nirf_rank === hit.e.rank && (col.nirf_band ?? null) === band && col.nirf_year === year && col.nirf_category === hit.cat && !col.nirf_note) continue

    const page = band ? BAND_PAGES.find(([, b]) => b === band)?.[0] ?? '' : ''
    const url = `https://www.nirfindia.org/Rankings/${year}/${hit.cat}Ranking${page}.html`
    const placed = band ? `Band ${band}` : `Rank ${hit.e.rank}`
    outcomes.push(
      await submitProposal(
        db,
        opts.runId,
        {
          entity: 'college',
          table: 'colleges',
          recordId: col.id,
          label: `${col.name} — NIRF ${year} ${hit.cat}`,
          fields: {
            nirf_rank: { old: col.nirf_rank, new: hit.e.rank, evidence: `${hit.e.name}, ${hit.e.city} — ${placed}` },
            nirf_band: { old: col.nirf_band ?? null, new: band, evidence: band ? `${hit.e.name}, ${hit.e.city} — ${placed}` : null },
            nirf_year: { old: col.nirf_year, new: year, evidence: null },
            nirf_category: { old: col.nirf_category, new: hit.cat, evidence: null },
            // Found under its own name: a "ranked as the parent university" note no longer applies
            ...(col.nirf_note ? { nirf_note: { old: col.nirf_note, new: null, evidence: null } } : {}),
          },
          sourceUrl: url,
          official: true,
          overwritesVerified: false,
          forceReview: hit.exact ? undefined : `Name matched loosely: "${col.name}" ≈ "${hit.e.name}" (${hit.e.city})`,
        },
        opts.dryRun
      )
    )
  }
  return { year, matched, outcomes, errors }
}
