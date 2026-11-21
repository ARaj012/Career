import { describe, expect, it } from 'vitest'
import { buildValueRows, flagship, payback, rupees, statedTotal, type CollegeIn, type CourseIn, type PlacementIn } from './college-value'

const college = (over: Partial<CollegeIn>): CollegeIn => ({
  id: 'c1', name: 'National Institute of Technology X', slug: 'nit-x', type: 'Government', city: 'X', state: 'Y',
  nirf_rank: 10, nirf_category: 'Engineering', annual_fees_min: 150000, annual_fees_max: 150000,
  fees_verified_at: null, fees_source_url: null, fee_note: null, ...over,
})
const nirf = (over: Partial<PlacementIn> = {}): PlacementIn => ({
  college_id: 'c1', program_level: 'UG 4-year', year: 2024, median_package: 1200000, students_placed: 500, source_type: 'nirf', ...over,
})

describe('buildValueRows', () => {
  it('compares the flagship fee with the same programme’s latest median', () => {
    const rows = buildValueRows([college({})], [], [nirf({ year: 2023, median_package: 900000 }), nirf()])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ totalFee: 600000, median: 1200000, placementYear: 2024, feeSource: 'college' })
    expect(rows[0].ratio).toBeCloseTo(0.5)
  })

  it('prefers the programme’s official fee and ignores unconfirmed programme rows', () => {
    const courses: CourseIn[] = [
      { college_id: 'c1', degree_type: 'Undergraduate', duration_years: 4, annual_fees_min: 2400000, annual_fees_max: 2400000, total_fees: null, source_type: 'unverified' },
    ]
    expect(buildValueRows([college({})], courses, [nirf()])[0].totalFee).toBe(600000)
    courses.push({ college_id: 'c1', degree_type: 'Undergraduate', duration_years: 4, annual_fees_min: 200000, annual_fees_max: 200000, total_fees: null, source_type: 'official' })
    expect(buildValueRows([college({})], courses, [nirf()])[0]).toMatchObject({ totalFee: 800000, feeOfficial: true, feeSource: 'programme' })
  })

  it('does not use a headline fee for a programme it is not about', () => {
    expect(buildValueRows([college({})], [], [nirf({ program_level: 'PG 2-year' })])).toHaveLength(0)
  })

  it('skips quota-wide unconfirmed ranges and total-fee notes without a figure', () => {
    expect(buildValueRows([college({ annual_fees_min: 40000, annual_fees_max: 450000 })], [], [nirf()])).toHaveLength(0)
    expect(buildValueRows([college({ fee_note: '4-yr B.Tech total fees' })], [], [nirf()])).toHaveLength(0)
  })
})

describe('helpers', () => {
  it('reads a stated total', () => {
    expect(statedTotal('2-yr MBA total ~₹27L')).toBe(2700000)
    expect(statedTotal('2-yr MBA total ~₹25-26L')).toBe(2550000)
    expect(statedTotal('2-yr MBA total fees')).toBeNull()
    expect(statedTotal('tuition ~₹2.2L/yr; management total ~₹18L')).toBeUndefined()
  })
  it('knows a college’s flagship programme', () => {
    expect(flagship({ name: 'Indian Institute of Management Indore', nirf_category: null })).toBe('PG 2-year')
    expect(flagship({ name: 'AIIMS Patna', nirf_category: null })).toBe('UG 5-year')
    expect(flagship({ name: 'University of Delhi', nirf_category: 'University' })).toBeNull()
  })
  it('formats money and payback', () => {
    expect(rupees(860000)).toBe('₹8.6 lakh')
    expect(rupees(45000)).toBe('₹45,000')
    expect(payback(0.5)).toBe('6 months of salary')
    expect(payback(2.04)).toBe('2.0 years of salary')
  })
})
