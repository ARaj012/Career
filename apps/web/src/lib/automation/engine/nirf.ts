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

export type NirfEntry = { name: string; city: string; state: string; rank: number; score: number | null }

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
]

export function canonName(name: string): string {
  let s = ` ${name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ')} `
  for (const [re, full] of ABBR) s = s.replace(re, full)
  return s.replace(/\bthe\b/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parseNirfTable(html: string): NirfEntry[] {
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
    if (iName < 0 || iRank < 0) return

    $t.children('tbody').children('tr').each((__, tr) => {
      const cells = $(tr).children('td')
      if (cells.length <= Math.max(iName, iRank)) return
      const cell = (i: number) => (i < 0 ? '' : $(cells[i]).clone().find('table, div').remove().end().text().replace(/\s+/g, ' ').trim())
      const rankText = cell(iRank)
      if (!/^\d+$/.test(rankText)) return // skip bands like 101-150
      const name = cell(iName).split(/more details/i)[0].trim()
      if (!name) return
      out.push({
        name,
        city: cell(iCity),
        state: cell(iState),
        rank: Number(rankText),
        score: iScore >= 0 ? Number(cell(iScore)) || null : null,
      })
    })
  })
  return out
}

async function fetchCategory(year: number, cat: Category): Promise<NirfEntry[] | null> {
  const url = `https://www.nirfindia.org/Rankings/${year}/${cat}Ranking.html`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) return null
    const rows = parseNirfTable(await res.text())
    return rows.length ? rows : null
  } catch {
    return null
  } finally {
    await new Promise((r) => setTimeout(r, 2500))
  }
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
    const rows = await fetchCategory(year, c)
    if (rows) lists.set(c, rows)
    else errors.push(`NIRF ${year} ${c}: no rows parsed`)
  }

  const { data: colleges } = await db.from('colleges').select('id, name, city, nirf_rank, nirf_year, nirf_category')
  const outcomes: ProposalOutcome[] = []
  let matched = 0

  for (const col of colleges ?? []) {
    if (col.nirf_year && col.nirf_year > year) continue
    const canon = canonName(col.name)
    let hit: { cat: Category; e: NirfEntry; exact: boolean } | null = null

    for (const cat of preferredCategories(col.name, col.nirf_category)) {
      const rows = lists.get(cat)
      if (!rows) continue
      const exact = rows.filter((r) => canonName(r.name) === canon)
      if (exact.length === 1) { hit = { cat, e: exact[0], exact: true }; break }
      const cityOk = (r: NirfEntry) => !!col.city && r.city.toLowerCase().includes(col.city.toLowerCase())
      const loose = rows.filter((r) => {
        const c = canonName(r.name)
        return (c.includes(canon) || canon.includes(c)) && cityOk(r)
      })
      if (loose.length === 1) { hit = { cat, e: loose[0], exact: false }; break }
    }
    if (!hit) continue
    matched++
    if (col.nirf_rank === hit.e.rank && col.nirf_year === year && col.nirf_category === hit.cat) continue

    const url = `https://www.nirfindia.org/Rankings/${year}/${hit.cat}Ranking.html`
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
            nirf_rank: { old: col.nirf_rank, new: hit.e.rank, evidence: `${hit.e.name}, ${hit.e.city} — Rank ${hit.e.rank}` },
            nirf_year: { old: col.nirf_year, new: year, evidence: null },
            nirf_category: { old: col.nirf_category, new: hit.cat, evidence: null },
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
