import { describe, it, expect } from 'vitest'
import { parsePlacementSections, parseStudentStrength, wordsToNumber } from './nirf-data'

// Lines as they come out of real NIRF 2025/2023 sheets (IIT Madras, IIM Ahmedabad, Miranda House)
const IITM = `Total Actual Student Strength (Program(s) Offered by your Institution)
UG [4 Years 2824 765 3589 667 2920 2 432 1876 208 1102 536 462
Program(s)]
UG [5 Years 961 225 1186 309 877 0 157 503 38 416 110 96
Program(s)]
Placement & Higher Studies
UG [4 Years Program(s)]: Placement & higher studies for previous 3 years
Academic Year No. of first year No. of first year Academic Year No. of students Academic Year No. of students No. of students Median salary of No. of students
2018-19 488 414 2019-20 0 2021-22 388 297 1700000(Seventeen 78
Laksh)
2019-20 762 806 2020-21 0 2022-23 639 496 1663440(Sixteen Lakh 96
Sixty three Thousand
Four Hundred And
Forty)
2020-21 877 929 2021-22 0 2023-24 714 549 1750000(Seventeen 153
lakhs fifty thousand)
PG [2 Years Program(s)]: Placement & higher studies for previous 3 years
2021-22 511 501 2022-23 429 390 1500000(Fifteem lakhs 12
)
Ph.D Student Details`

const MIRANDA = `PG [2 Years Program(s)]: Placement & Higher Studies for previous 3 years
2019-20 356 299 2020-21 262 16 617500(Six Lakh 80
Seventy Thousand
Five Hundred Only)
UG [3 Years Program(s)]: Placement & Higher Studies for previous 3 years
2018-19 1001 1215 2020-21 1140 88 600000(Six Lakh Only) 910
Financial Resources: Utilised Amount for the Capital Expenditure for previous 3 years`

describe('wordsToNumber', () => {
  it('reads Indian amounts, including the typos found in real sheets', () => {
    expect(wordsToNumber('Seventeen Laksh')).toBe(1_700_000)
    expect(wordsToNumber('Sixteen Lakh Sixty three Thousand Four Hundred And Forty')).toBe(1_663_440)
    expect(wordsToNumber('Rupees Thirty One Lakhs Only')).toBe(3_100_000)
    expect(wordsToNumber('Fifteem lakhs')).toBe(1_500_000)
    expect(wordsToNumber('One Crore Twenty Lakh')).toBe(12_000_000)
    expect(wordsToNumber('Seventeen Lakhs Fifty Thousand')).toBe(1_750_000)
    expect(wordsToNumber('approximately seventeen')).toBeNull()
  })
})

describe('parsePlacementSections', () => {
  it('reads every graduating year per program level with its median', () => {
    const rows = parsePlacementSections(IITM)
    expect(rows.map((r) => `${r.level} ${r.year}`)).toEqual(['UG 4-year 2022', 'UG 4-year 2023', 'UG 4-year 2024', 'PG 2-year 2023'])
    expect(rows[0]).toMatchObject({ graduating: 388, placed: 297, median: 1_700_000, higherStudies: 78 })
    expect(rows[1]).toMatchObject({ graduating: 639, placed: 496, median: 1_663_440, higherStudies: 96 })
    expect(rows[2]).toMatchObject({ median: 1_750_000, higherStudies: 153 })
    expect(rows[3]).toMatchObject({ graduating: 429, placed: 390, median: 1_500_000, higherStudies: 12 })
  })

  it('drops a median whose figure disagrees with the amount in words', () => {
    const [pg, ug] = parsePlacementSections(MIRANDA)
    expect(pg.median).toBeNull()
    expect(pg.medianIssue).toMatch(/617500.*670500/)
    expect(pg).toMatchObject({ graduating: 262, placed: 16, higherStudies: 80 })
    expect(ug).toMatchObject({ level: 'UG 3-year', year: 2021, median: 600_000, higherStudies: 910 })
  })
})

describe('parseStudentStrength', () => {
  it('adds the program totals only when male + female = total', () => {
    expect(parseStudentStrength(IITM)).toBe(3589 + 1186)
  })
})
