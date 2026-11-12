/** Placement rows as stored in college_placements, with provenance. */
export type PlacementRow = {
  year: number
  program_level: string
  source_type: 'nirf' | 'official_report' | 'unverified'
  placement_rate: number | null
  average_package: number | null
  median_package: number | null
  highest_package: number | null
  students_placed: number | null
  total_eligible_students: number | null
  higher_studies: number | null
  top_recruiters: string | null
  source_url: string | null
  notes: string | null
}

export const isOfficial = (r: PlacementRow) => r.source_type === 'nirf' || r.source_type === 'official_report'

/**
 * Course-wise figures from an institute's own placement report are stored with
 * program_level "Course: <programme>"; they sit beside, not inside, the NIRF
 * program-level series.
 */
export const COURSE_PREFIX = 'Course: '
export const isCourseRow = (r: PlacementRow) => r.program_level.startsWith(COURSE_PREFIX)

/** "2024" → "2023-24": NIRF figures are per graduating batch. */
export const batchLabel = (year: number) => `${year - 1}-${String(year).slice(2)}`

export function formatPackage(n: number | null | undefined): string | null {
  if (!n) return null
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

/**
 * Official program levels ordered by size of the latest batch, so an
 * engineering college leads with its B.Tech (UG 4-year) and an IIM with its PG.
 */
export function officialLevels(rows: PlacementRow[]): string[] {
  const official = rows.filter((r) => isOfficial(r) && !isCourseRow(r))
  const size = new Map<string, number>()
  for (const r of official) {
    const latest = Math.max(...official.filter((x) => x.program_level === r.program_level).map((x) => x.year))
    if (r.year === latest) size.set(r.program_level, r.total_eligible_students ?? 0)
  }
  return [...size.entries()].sort((a, b) => b[1] - a[1]).map(([level]) => level)
}

/** Readable program level: "UG 4-year" → "UG (4-year programs)". */
export const levelLabel = (level: string) => {
  const m = /^(UG|PG|PG-INTEGRATED) (\d+)-year$/i.exec(level)
  return m ? `${m[1] === 'PG-INTEGRATED' ? 'Integrated PG' : m[1]} (${m[2]}-year programs)` : level
}
