/**
 * College cost vs placement: puts a programme's fees next to the median salary
 * its graduates got, both for the same programme level (a 4-year degree's fee
 * is compared with 4-year graduates' salaries, an MBA's with MBA salaries).
 *
 * Salaries are NIRF data the colleges themselves submitted (latest year).
 * Fees come from the programme's own fee row when we have one, otherwise from
 * the college's headline fee — but only for its flagship programme (an IIM's
 * headline fee is its MBA fee, an IIT's is its B.Tech fee).
 */

export type Programme = 'UG 4-year' | 'UG 3-year' | 'UG 5-year' | 'PG 2-year'

export const PROGRAMMES: { key: Programme; label: string; years: number }[] = [
  { key: 'UG 4-year', label: '4-year degrees (B.Tech, B.E., B.Pharm, BS)', years: 4 },
  { key: 'PG 2-year', label: '2-year Master’s (MBA, M.Tech, M.Sc)', years: 2 },
  { key: 'UG 5-year', label: '5-year degrees (MBBS, B.Arch, BA LLB)', years: 5 },
  { key: 'UG 3-year', label: '3-year degrees (B.Sc, B.Com, BA, BBA)', years: 3 },
]

export interface CollegeIn {
  id: string
  name: string
  slug: string
  type: string | null
  city: string | null
  state: string | null
  nirf_rank: number | null
  nirf_category: string | null
  annual_fees_min: number | null
  annual_fees_max: number | null
  fees_verified_at: string | null
  fees_source_url: string | null
  fee_note: string | null
}

export interface CourseIn {
  college_id: string
  degree_type: string | null
  duration_years: number | string | null
  annual_fees_min: number | null
  annual_fees_max: number | null
  total_fees: number | null
  source_type: string | null
}

export interface PlacementIn {
  college_id: string
  program_level: string | null
  year: number | null
  median_package: number | string | null
  students_placed: number | null
  source_type: string | null
}

export interface ValueRow {
  collegeId: string
  name: string
  slug: string
  type: 'Government' | 'Private' | 'Deemed'
  place: string
  nirfRank: number | null
  programme: Programme
  /** Whole-course fee in rupees */
  totalFee: number
  annualFee: number
  feeOfficial: boolean
  feeSource: 'programme' | 'college'
  median: number
  placementYear: number
  placed: number | null
  /** Whole-course fee ÷ median first-year salary */
  ratio: number
}

const DEGREE: Record<Programme, RegExp> = {
  'UG 4-year': /^(undergraduate|ug)$/i,
  'UG 3-year': /^(undergraduate|ug)$/i,
  'UG 5-year': /^(undergraduate|ug|integrated)$/i,
  'PG 2-year': /^(postgraduate|pg)$/i,
}

const yearsOf = (p: Programme) => PROGRAMMES.find((x) => x.key === p)!.years

/** The programme a college's headline fee is for, or null when we can't tell. */
export function flagship(c: Pick<CollegeIn, 'name' | 'nirf_category'>): Programme | null {
  const cat = c.nirf_category ?? ''
  const n = c.name
  if (/management/i.test(cat) || /institute of management|\bIIM\b|school of business|management institute/i.test(n)) return 'PG 2-year'
  if (/medical|dental/i.test(cat) || /medical|\bAIIMS\b|\bJIPMER\b|dental/i.test(n)) return 'UG 5-year'
  if (/law/i.test(cat) || /law (school|university)|national law|\bNLU\b/i.test(n)) return 'UG 5-year'
  if (/architecture/i.test(cat) || /school of planning and architecture/i.test(n)) return 'UG 5-year'
  if (/engineering|pharmacy/i.test(cat) ||
    /institute of technology|institute of information technology|engineering|\bIIT\b|\bNIT\b|\bIIIT\b|institute of engineering/i.test(n))
    return 'UG 4-year'
  return null
}

/**
 * A whole-course total written in an unconfirmed fee note ("2-yr MBA total ~₹27L").
 * undefined: the note doesn't talk about a total; null: it does but gives no figure.
 */
export function statedTotal(note: string | null): number | null | undefined {
  if (!note || !/\btotal\b/i.test(note) || /per year|a year|annual|each year|\/yr|per annum/i.test(note)) return undefined
  const m = note.match(/₹\s?(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*(?:L\b|lakh)/i)
  if (!m) return null
  const lo = Number(m[1])
  const hi = m[2] ? Number(m[2]) : lo
  return ((lo + hi) / 2) * 1e5
}

/** An unconfirmed range so wide (₹44,000–₹4.5 lakh) that it spans quotas, not one fee. */
const quotaSpread = (c: CollegeIn) =>
  !c.fees_verified_at && !!c.annual_fees_min && !!c.annual_fees_max && c.annual_fees_max / c.annual_fees_min > 2.5

const mid = (a: number | null, b: number | null) => (a && b ? (a + b) / 2 : a || b || 0)

function normaliseType(t: string | null): ValueRow['type'] {
  if (/deemed/i.test(t ?? '')) return 'Deemed'
  if (/government|public|central|state/i.test(t ?? '')) return 'Government'
  return 'Private'
}

export function buildValueRows(colleges: CollegeIn[], courses: CourseIn[], placements: PlacementIn[]): ValueRow[] {
  const byCollege = new Map<string, CourseIn[]>()
  for (const c of courses) {
    if (!byCollege.has(c.college_id)) byCollege.set(c.college_id, [])
    byCollege.get(c.college_id)!.push(c)
  }
  // Latest NIRF median per college × programme
  const latest = new Map<string, PlacementIn>()
  for (const p of placements) {
    if (p.source_type !== 'nirf' || !p.median_package || !p.year) continue
    if (!PROGRAMMES.some((x) => x.key === p.program_level)) continue
    const key = `${p.college_id}|${p.program_level}`
    const prev = latest.get(key)
    if (!prev || (prev.year ?? 0) < p.year) latest.set(key, p)
  }

  const rows: ValueRow[] = []
  const collegeById = new Map(colleges.map((c) => [c.id, c]))
  for (const p of latest.values()) {
    const c = collegeById.get(p.college_id)
    if (!c) continue
    const programme = p.program_level as Programme
    const years = yearsOf(programme)

    // 1. the programme's own official fee rows. Unconfirmed programme rows are not
    // used: many hold the whole-course total in the yearly column (an MBA's ₹27 lakh
    // shown as "a year"), which would double or quadruple the cost.
    const pick = (byCollege.get(c.id) ?? []).filter((k) =>
      k.source_type === 'official' &&
      DEGREE[programme].test(k.degree_type ?? '') &&
      Math.round(Number(k.duration_years)) === years &&
      (k.annual_fees_min || k.annual_fees_max || k.total_fees))

    let annualFee = 0
    let totalFee = 0
    let feeOfficial = false
    let feeSource: ValueRow['feeSource'] = 'programme'
    if (pick.length) {
      // Several fee rows (e.g. one per branch): the middle one
      const totals = pick
        .map((k) => k.total_fees || mid(k.annual_fees_min, k.annual_fees_max) * years)
        .filter((n) => n > 0)
        .sort((a, b) => a - b)
      totalFee = totals[Math.floor(totals.length / 2)]
      annualFee = totalFee / years
      feeOfficial = true
    } else if (flagship(c) === programme && (c.annual_fees_min || c.annual_fees_max) && !quotaSpread(c)) {
      // 2. the college's headline fee, which is for its flagship programme
      const total = statedTotal(c.fee_note)
      if (total !== undefined) {
        totalFee = total ?? 0 // null: the note says "total" but gives no figure, so the range is unclear
        annualFee = totalFee / years
      } else {
        annualFee = mid(c.annual_fees_min, c.annual_fees_max)
        totalFee = annualFee * years
      }
      feeOfficial = !!c.fees_verified_at
      feeSource = 'college'
    }
    if (!totalFee) continue

    const median = Number(p.median_package)
    rows.push({
      collegeId: c.id,
      name: c.name,
      slug: c.slug,
      type: normaliseType(c.type),
      place: [c.city, c.state].filter(Boolean).join(', '),
      nirfRank: c.nirf_rank,
      programme,
      totalFee: Math.round(totalFee),
      annualFee: Math.round(annualFee),
      feeOfficial,
      feeSource,
      median,
      placementYear: p.year!,
      placed: p.students_placed,
      ratio: totalFee / median,
    })
  }
  return rows.sort((a, b) => a.ratio - b.ratio)
}

/** ₹8.6 lakh, ₹45,000, ₹1.2 crore */
export function rupees(n: number): string {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} crore`
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(1)} lakh`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

/** "0.4 years of salary", "under a year", "3.1 years" */
export function payback(ratio: number): string {
  const months = Math.round(ratio * 12)
  if (months <= 1) return 'under a month of salary'
  if (ratio < 1) return `${months} months of salary`
  return `${ratio.toFixed(1)} years of salary`
}
