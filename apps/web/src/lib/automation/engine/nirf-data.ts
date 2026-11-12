/**
 * Official placement data from the NIRF "Data Submitted by Institution"
 * sheets (nirfindia.org, Ministry of Education). Each sheet gives, per
 * program level and graduating year: students graduating, students placed,
 * median salary and students going for higher studies.
 *
 * Deterministic parsing, no AI. Three NIRF editions together cover five
 * graduating years. A median is kept only when the figure matches the
 * amount the institution wrote in words; otherwise it is left empty.
 */
import * as cheerio from 'cheerio'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPage, USER_AGENT } from './http'
import { canonName } from './nirf'
import { submitProposal, type Change, type ProposalOutcome } from './proposals'

// ---------------------------------------------------------------- words → number

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
}
const SCALES: Record<string, number> = { hundred: 100, thousand: 1_000, lakh: 100_000, crore: 10_000_000 }
// Spellings seen in real sheets
const FIX: Record<string, string> = {
  lakhs: 'lakh', lac: 'lakh', lacs: 'lakh', laksh: 'lakh', lakshs: 'lakh', lak: 'lakh', laks: 'lakh',
  crores: 'crore', hundered: 'hundred', hundreds: 'hundred', thousands: 'thousand', fifteem: 'fifteen',
  ninty: 'ninety', fourty: 'forty',
}
const FILLER = new Set(['rupees', 'rs', 'inr', 'only', 'and', 'per', 'annum', 'lpa'])

/** "Seventeen Lakhs Fifty Thousand" → 1750000; null when any word is not understood. */
export function wordsToNumber(words: string): number | null {
  const tokens = words.toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/[\s-]+/).filter(Boolean)
  let total = 0
  let current = 0
  let seen = false
  for (const raw of tokens) {
    const t = FIX[raw] ?? raw
    if (FILLER.has(t)) continue
    if (t in UNITS) { current += UNITS[t]; seen = true; continue }
    if (t === 'hundred') { current = (current || 1) * 100; seen = true; continue }
    if (t in SCALES) { total += (current || 1) * SCALES[t]; current = 0; seen = true; continue }
    return null
  }
  return seen ? total + current : null
}

// ---------------------------------------------------------------- sheet parsing

export type NirfPlacementRow = {
  level: string // e.g. "UG 4-year"
  year: number // graduating year, e.g. 2024 for 2023-24
  graduating: number | null
  placed: number | null
  median: number | null
  medianIssue?: string
  higherStudies: number | null
  quote: string // the row as printed, for the evidence trail
}

const SECTION = /^(UG|PG|PG-Integrated)\s*\[(\d+)\s*Years?\s*Program\(s\)\]\s*:\s*Placement/i
const ACADEMIC_YEAR = /^(\d{4})-(\d{2})$/

/** Parse the "Placement & Higher Studies" tables of one NIRF sheet. */
export function parsePlacementSections(text: string): NirfPlacementRow[] {
  const lines = text.split('\n').map((l) => l.trim())
  const rows: NirfPlacementRow[] = []
  let level: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const sec = SECTION.exec(line)
    if (sec) { level = `${sec[1].toUpperCase()} ${sec[2]}-year`; continue }
    if (/^(Ph\.?D|Financial Resources|Sustainability|PCS Facilities|Faculty Details)/i.test(line)) { level = null; continue }
    if (!level || !/^\d{4}-\d{2}\b/.test(line)) continue

    // Columns: intake-year intake admitted [lateral-year lateral] graduating-year graduating placed median(words…) higher
    const head = line.split('(')[0].trim().split(/\s+/)
    const yearIdx = head.map((t, j) => (ACADEMIC_YEAR.test(t) ? j : -1)).filter((j) => j >= 0)
    if (yearIdx.length < 2) continue
    const g = yearIdx[yearIdx.length - 1]
    const ym = ACADEMIC_YEAR.exec(head[g])!
    const num = (s: string | undefined) => (s !== undefined && /^\d+$/.test(s) ? Number(s) : null)
    const graduating = num(head[g + 1])
    const placed = num(head[g + 2])
    const medianDigits = num(head[g + 3])

    // Words run from "(" to ")", possibly over the next lines; the higher-studies
    // count sits on the row line after the first word(s) or after ")".
    let words = ''
    let rest = line.includes('(') ? line.slice(line.indexOf('(') + 1) : ''
    let j = i
    for (;;) {
      const close = rest.indexOf(')')
      words += ' ' + (close >= 0 ? rest.slice(0, close) : rest)
      if (close >= 0 || j + 1 >= lines.length || /^\d{4}-\d{2}\b/.test(lines[j + 1]) || SECTION.test(lines[j + 1])) break
      rest = lines[++j]
    }
    const trailing = line.match(/(\d+)\s*$/)
    const higherStudies = line.includes('(') && trailing && Number(trailing[1]) !== medianDigits ? Number(trailing[1]) : num(head[g + 4])

    let median = medianDigits === 0 ? null : medianDigits // 0 = nobody placed that year
    let medianIssue: string | undefined
    const inWords = wordsToNumber(words.replace(/\d+/g, ' '))
    if (median !== null && (median < 50_000 || median > 50_000_000)) {
      medianIssue = `median ${median} outside a plausible range`
      median = null
    } else if (median !== null && inWords !== null && inWords !== median) {
      medianIssue = `figure ${median} does not match the amount in words (${inWords})`
      median = null
    }
    // No batch graduated (new or discontinued program): nothing to report for that year
    if (!graduating && !placed && median === null) { i = j; continue }
    rows.push({
      level,
      year: Number(ym[1]) + 1,
      graduating,
      placed: placed !== null && graduating !== null && placed > graduating ? null : placed,
      median,
      medianIssue,
      higherStudies,
      quote: lines.slice(i, j + 1).join(' ').replace(/\s+/g, ' ').slice(0, 300),
    })
    i = j
  }
  return rows
}

/** 2024 → "2023-24" */
export const academicYear = (endYear: number) => `${endYear - 1}-${String(endYear).slice(2)}`

/** Total students across programs from "Total Actual Student Strength". */
export function parseStudentStrength(text: string): number | null {
  const start = text.indexOf('Total Actual Student Strength')
  const end = text.indexOf('Placement & Higher Studies')
  if (start < 0 || end < start) return null
  let total = 0
  let found = false
  // Program rows: "UG [4 Years 2824 765 3589 …" → male, female, total are the first three numbers
  for (const m of text.slice(start, end).matchAll(/^(?:UG|PG|PG-Integrated)\s*\[\d+\s*Years?[^\d\n]*(\d+)\s+(\d+)\s+(\d+)/gim)) {
    const [male, female, all] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (male + female !== all) return null // columns did not line up; do not guess
    total += all
    found = true
  }
  return found ? total : null
}

// ---------------------------------------------------------------- NIRF directory

const CATEGORIES = ['Overall', 'University', 'College', 'Engineering', 'Management', 'Medical', 'Law', 'Pharmacy', 'Architecture', 'Dental', 'Research', 'Agriculture'] as const
const BAND_PAGES = ['', '150', '200', '300'] // top list, then the rank-band pages

export type DirEntry = { name: string; city: string; category: string; edition: number; pdf: string; rank: string }

async function fetchDirectory(edition: number): Promise<DirEntry[]> {
  const out: DirEntry[] = []
  for (const cat of CATEGORIES) {
    for (const band of BAND_PAGES) {
      const url = `https://www.nirfindia.org/Rankings/${edition}/${cat}Ranking${band}.html`
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(30_000) })
        if (!res.ok) continue
        const $ = cheerio.load(await res.text())
        $('table tbody tr').each((_, tr) => {
          const cells = $(tr).children('td')
          const pdf = $(tr).find('a[href$=".pdf"], a[href*=".pdf"]').first().attr('href')
          if (cells.length < 3 || !pdf) return
          const text = (k: number) => $(cells[k]).clone().find('table, div').remove().end().text().replace(/\s+/g, ' ').trim()
          const name = text(1).split(/more details/i)[0].trim()
          if (!name) return
          out.push({ name, city: text(2), category: cat, edition, pdf: new URL(pdf, url).toString(), rank: text(cells.length - 1) })
        })
      } catch {
        // page missing for this category/band; NIRF does not publish every combination
      } finally {
        await new Promise((r) => setTimeout(r, 2500))
      }
    }
  }
  return out
}

function preferred(name: string, current: string | null): string[] {
  const n = name.toLowerCase()
  const first: string[] = current ? [current] : []
  if (/technology|engineering/.test(n)) first.push('Engineering')
  if (/management|business/.test(n)) first.push('Management')
  if (/medical|aiims|medicine/.test(n)) first.push('Medical')
  if (/law|legal|juridical/.test(n)) first.push('Law')
  if (/pharma/.test(n)) first.push('Pharmacy')
  if (/dental/.test(n)) first.push('Dental')
  if (/university/.test(n)) first.push('University')
  if (/college/.test(n)) first.push('College')
  return [...new Set([...first, 'Overall', ...CATEGORIES])]
}

/** Disciplines a college's own name commits it to ("Faculty of Law" → Law). */
export function disciplinesOf(name: string): string[] {
  const n = name.toLowerCase()
  const out: string[] = []
  if (/\blaw\b|legal|juridical/.test(n)) out.push('Law')
  if (/medical|medicine|aiims/.test(n)) out.push('Medical')
  if (/dental/.test(n)) out.push('Dental')
  if (/pharma/.test(n)) out.push('Pharmacy')
  if (/management|business/.test(n)) out.push('Management')
  if (/technology|engineering/.test(n)) out.push('Engineering')
  if (/architecture|planning/.test(n)) out.push('Architecture')
  return out
}

/** One sheet per edition for this college: exact name, else unique name-contains + same city. */
export function findSheets(col: { name: string; city: string | null; nirf_category: string | null }, dir: DirEntry[]) {
  const canon = canonName(col.name)
  const picks: { entry: DirEntry; exact: boolean }[] = []
  // A loose match must come from the college's own discipline: "BHU Faculty of Law" may use the
  // Law sheet but never BHU's whole-university sheet; "Institute of Technology, Nirma" never
  // Nirma's management school
  const own = disciplinesOf(col.name)
  for (const edition of [...new Set(dir.map((d) => d.edition))]) {
    for (const cat of preferred(col.name, col.nirf_category)) {
      const rows = dir.filter((d) => d.edition === edition && d.category === cat)
      const exact = rows.filter((r) => canonName(r.name) === canon)
      if (exact.length === 1) { picks.push({ entry: exact[0], exact: true }); break }
      if (own.length && !own.includes(cat)) continue
      const city = (col.city ?? '').toLowerCase()
      const loose = rows.filter((r) => {
        const c = canonName(r.name)
        return (c.includes(canon) || canon.includes(c)) && !!city && r.city.toLowerCase().includes(city)
      })
      if (loose.length === 1) { picks.push({ entry: loose[0], exact: false }); break }
    }
  }
  return picks
}

// ---------------------------------------------------------------- update

async function allRows<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) return out
  }
}

// The ranking directories take many requests to read and change once a year;
// a sweep reuses them across its batches (same server process) for an hour.
const dirCache = new Map<number, { at: number; entries: Promise<DirEntry[]> }>()
function cachedDirectory(edition: number): Promise<DirEntry[]> {
  const hit = dirCache.get(edition)
  if (hit && Date.now() - hit.at < 3600_000) return hit.entries
  const entries = fetchDirectory(edition).catch((err) => { dirCache.delete(edition); throw err })
  dirCache.set(edition, { at: Date.now(), entries })
  return entries
}

export async function updateNirfPlacements(
  db: SupabaseClient,
  // offset + limit: one slice of the colleges (alphabetical), so a sweep can work through them across requests
  opts: { runId: string | null; dryRun: boolean; limit?: number; offset?: number; today?: Date; log?: (s: string) => void }
): Promise<{ colleges: number; rows: number; outcomes: ProposalOutcome[]; errors: string[]; issues: string[]; total: number }> {
  const say = opts.log ?? console.log
  const Y = (opts.today ?? new Date()).getFullYear()
  const errors: string[] = []
  const issues: string[] = []
  const outcomes: ProposalOutcome[] = []

  // Newest edition first: when two editions report the same graduating year, the newer wins
  const editions = [Y, Y - 1, Y - 2, Y - 3]
  const dir: DirEntry[] = []
  for (const e of editions) {
    const entries = await cachedDirectory(e)
    say(`  NIRF ${e}: ${entries.length} institution sheets listed`)
    dir.push(...entries)
  }
  const usable = [...new Set(dir.map((d) => d.edition))].sort((a, b) => b - a).slice(0, 3)
  const directory = dir.filter((d) => usable.includes(d.edition))
  if (!directory.length) return { colleges: 0, rows: 0, outcomes, errors: ['NIRF ranking pages not reachable or format changed'], issues, total: 0 }

  const { data: colleges } = await db.from('colleges').select('id, name, city, nirf_category, total_students').order('name')
  // Both tables hold more rows than one request returns (1000), so read them page by page
  const existing = await allRows<{ id: string; college_id: string; year: number; program_level: string }>((from, to) =>
    db.from('college_placements').select('id, college_id, year, program_level, graduating:total_eligible_students, students_placed, median_package, placement_rate, higher_studies').eq('source_type', 'nirf').order('id').range(from, to))
  const have = new Map(existing.map((r) => [`${r.college_id}|${r.year}|${r.program_level}`, r]))
  const enrolled = await allRows<{ id: string; college_id: string; year: number; total_students: number; source_type: string }>((from, to) =>
    db.from('college_enrollment_history').select('id, college_id, year, total_students, source_type').order('id').range(from, to))
  const enrolment = new Map(enrolled.map((r) => [`${r.college_id}|${r.year}`, r]))

  // Each edition reports the academic year before it: India Rankings 2025 → students in 2023-24
  const enrolmentFor = async (col: { id: string; name: string }, entry: DirEntry, exact: boolean, students: number): Promise<ProposalOutcome[]> => {
    const year = entry.edition - 1
    const old = enrolment.get(`${col.id}|${year}`)
    if (old && old.source_type === 'nirf' && old.total_students === students) return []
    return [
      await submitProposal(db, opts.runId, {
        entity: 'college',
        table: 'college_enrollment_history',
        recordId: old?.id ?? null,
        parentId: col.id,
        label: `${col.name} · students enrolled ${academicYear(year)} (NIRF ${entry.edition})`,
        fields: { total_students: { old: old?.total_students ?? null, new: students, evidence: 'Total Actual Student Strength (all programs, all years)' } },
        insertKey: old ? undefined : { college_id: col.id, year },
        extra: { source_type: 'nirf', source_url: entry.pdf, academic_year: academicYear(year) },
        sourceUrl: entry.pdf,
        official: true,
        overwritesVerified: false,
        forceReview: exact ? undefined : `Name matched loosely: "${col.name}" ≈ "${entry.name}" (${entry.city}); check it is the same institution`,
      }, opts.dryRun),
    ]
  }

  let collegeCount = 0
  let rowCount = 0
  const offset = opts.offset ?? 0
  for (const col of (colleges ?? []).slice(offset, offset + (opts.limit ?? Infinity))) {
    const sheets = findSheets(col, directory).sort((a, b) => b.entry.edition - a.entry.edition)
    if (!sheets.length) continue
    collegeCount++
    say(`  📄 ${col.name}: ${sheets.map((s) => `${s.entry.edition} ${s.entry.category}${s.exact ? '' : ' (loose match)'}`).join(', ')}`)

    const taken = new Set<string>()
    let strength: { n: number; url: string } | null = null
    for (const { entry, exact } of sheets) {
      let text: string
      try {
        text = (await fetchPage(entry.pdf)).text
      } catch (err) {
        errors.push(`${col.name} ${entry.edition}: ${(err as Error).message}`)
        continue
      }
      if (!/Data Submitted by Institution/i.test(text)) { errors.push(`${col.name} ${entry.edition}: not a NIRF data sheet`); continue }
      const students = parseStudentStrength(text)
      if (students && !strength) strength = { n: students, url: entry.pdf }
      if (students) outcomes.push(...(await enrolmentFor(col, entry, exact, students)))

      for (const r of parsePlacementSections(text)) {
        const key = `${col.id}|${r.year}|${r.level}`
        if (taken.has(key)) continue // a newer edition already gave this year
        taken.add(key)
        if (r.medianIssue) issues.push(`${col.name} ${r.level} ${r.year}: ${r.medianIssue}`)

        const rate = r.placed !== null && r.graduating ? Math.round((r.placed / r.graduating) * 1000) / 10 : null
        const next = { total_eligible_students: r.graduating, students_placed: r.placed, median_package: r.median, placement_rate: rate, higher_studies: r.higherStudies }
        const old = have.get(key) as Record<string, unknown> | undefined
        const fields: Record<string, Change> = {}
        for (const [k, v] of Object.entries(next)) {
          const before = old ? (old[k === 'total_eligible_students' ? 'graduating' : k] ?? null) : null
          if (v !== null && Number(before) !== v) fields[k] = { old: before, new: v, evidence: r.quote }
        }
        if (!Object.keys(fields).length) continue
        rowCount++
        outcomes.push(
          await submitProposal(
            db,
            opts.runId,
            {
              entity: 'college',
              table: 'college_placements',
              recordId: (old?.id as string) ?? null,
              parentId: col.id,
              label: `${col.name} · ${r.level} · graduated ${r.year - 1}-${String(r.year).slice(2)}`,
              fields,
              insertKey: old ? undefined : { college_id: col.id, year: r.year, program_level: r.level, source_type: 'nirf' },
              extra: { source_url: entry.pdf, notes: `NIRF ${entry.edition} data submitted by the institution (${entry.category})` },
              sourceUrl: entry.pdf,
              official: true,
              overwritesVerified: false,
              forceReview: exact ? undefined : `Name matched loosely: "${col.name}" ≈ "${entry.name}" (${entry.city}); check it is the same institution`,
            },
            opts.dryRun
          )
        )
      }
    }
    if (strength && strength.n !== col.total_students && sheets[0].exact) {
      outcomes.push(
        await submitProposal(
          db,
          opts.runId,
          {
            entity: 'college',
            table: 'colleges',
            recordId: col.id,
            label: `${col.name} — total students (NIRF)`,
            fields: { total_students: { old: col.total_students, new: strength.n, evidence: 'Total Actual Student Strength (all programs, all years)' } },
            sourceUrl: strength.url,
            official: true,
            overwritesVerified: false,
          },
          opts.dryRun
        )
      )
    }
  }
  return { colleges: collegeCount, rows: rowCount, outcomes, errors, issues, total: (colleges ?? []).length }
}
