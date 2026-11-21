import { quoteNamesTopic, syllabusSection } from './syllabus'
import { quoteNamesCategory, cutoffLines } from './exam-cutoffs'
import { describe, it, expect } from 'vitest'
import { normalize, quoteOnPage, quoteSupportsDate, quoteSupportsNumber, isTentative } from './evidence'
import { validateSchedule, validateScholarship } from './validate'
import { examNamePattern, normalizeSession, soleHost } from './exams'
import { relevantLinks } from './http'
import { quoteSupportsGrade, quoteSupportsYear } from './colleges'
import { addsNothing, careerContext, usableSentence } from './careers'
import { annualCharges, degreeType, handVerifiedFee, semesterFeeNote, headedByCourse, semesterColumns, verifiedFeeGuard, isNotAProgramme, narrowAdmissionPage, NOT_A_STEP, otherWww, placementTable, programmeName, quoteNamesMetric, quoteNamesCourse, quoteNamesYear } from './college-details'
import { matchInstitute } from './josaa'
import { canonName, dedupe, looseNameMatch, parseNirfTable } from './nirf'
import { isOfficialUrl, locateQuote } from './sources'
import { focusText, htmlToText, itemsToLines } from './http'
import { load } from 'cheerio'

const TODAY = new Date('2026-10-27T00:00:00Z')

describe('quoteSupportsDate', () => {
  it('accepts common Indian date formats', () => {
    expect(quoteSupportsDate('2027-01-20', 'Session 1: 20, 21, 22, 23, 24 & 28 January 2027')).toBe(true)
    expect(quoteSupportsDate('2027-01-28', 'Session 1: 20, 21, 22, 23, 24 & 28 January 2027')).toBe(true)
    expect(quoteSupportsDate('2026-11-22', 'Last date: 22.11.2026 (up to 11:50 PM)')).toBe(true)
    expect(quoteSupportsDate('2026-09-02', 'GOAPS opens on 2nd September 2026')).toBe(true)
    expect(quoteSupportsDate('2026-11-29', 'CAT will be held on Sunday, November 29, 2026')).toBe(true)
    expect(quoteSupportsDate('2027-03-19', 'Result: 19/03/2027')).toBe(true)
  })
  it('rejects dates the quote does not contain', () => {
    // The exact failure mode of a hallucinating model
    expect(quoteSupportsDate('2027-01-22', 'Session 1: 20, 21 & 28 January 2027')).toBe(false)
    expect(quoteSupportsDate('2027-02-20', '20 January 2027')).toBe(false)
    expect(quoteSupportsDate('2027-01-02', 'Exam on 20 January 2027')).toBe(false) // "2" inside "20" must not match
    expect(quoteSupportsDate('not-a-date', '20 January 2027')).toBe(false)
  })
})

describe('quoteOnPage / locateQuote', () => {
  const page = 'Important Dates\nOnline Submission of Application Form | 24 October 2026 to 22 November 2026 (up to 11:50 PM)'
  it('tolerates whitespace and punctuation differences', () => {
    expect(quoteOnPage('Application Form | 24 October 2026 to 22 November 2026', normalize(page))).toBe(true)
  })
  it('rejects invented or too-short quotes', () => {
    expect(quoteOnPage('Registration closes 30 November 2026', normalize(page))).toBe(false)
    expect(quoteOnPage('2026', normalize(page))).toBe(false)
    expect(quoteOnPage(null, normalize(page))).toBe(false)
  })
  it('returns the URL of the page that contains the quote', () => {
    const pages = [
      { url: 'a', finalUrl: 'https://a.nic.in', text: 'nothing here', status: 200, kind: 'html' as const, hash: '', links: [] },
      { url: 'b', finalUrl: 'https://b.nic.in/notice', text: page, status: 200, kind: 'html' as const, hash: '', links: [] },
    ]
    expect(locateQuote('24 October 2026 to 22 November 2026', pages, new Map())).toBe('https://b.nic.in/notice')
    expect(locateQuote('1 December 2026', pages, new Map())).toBeNull()
  })
})

describe('quoteSupportsNumber', () => {
  it('handles Indian number formats', () => {
    expect(quoteSupportsNumber(125000, 'Rs. 1,25,000 per annum')).toBe(true)
    expect(quoteSupportsNumber(150000, 'up to ₹1.5 lakh per year')).toBe(true)
    expect(quoteSupportsNumber(50000, 'Rs. 12,000 per annum')).toBe(false)
  })
  it('reads LPA, crore and short units, and every amount in the quote', () => {
    expect(quoteSupportsNumber(1_850_000, 'Average CTC: 18.5 LPA, highest 1.2 Cr')).toBe(true)
    expect(quoteSupportsNumber(12_000_000, 'Average CTC: 18.5 LPA, highest 1.2 Cr')).toBe(true)
    expect(quoteSupportsNumber(2_450_000, 'Median package ₹24.5 L (2023-24)')).toBe(true)
    expect(quoteSupportsNumber(150_000, 'UG ₹1 lakh, PG ₹1.5 lakh per year')).toBe(true)
  })
  it('does not find a number inside a bigger one', () => {
    expect(quoteSupportsNumber(12_000, 'Tuition fee Rs. 1,20,000 per year')).toBe(false)
    expect(quoteSupportsNumber(2024, 'Placements 2024: 95% placed')).toBe(true)
  })
})

describe('isTentative', () => {
  it('flags hedged wording', () => {
    expect(isTentative('Result likely by first week of January 2027')).toBe(true)
    expect(isTentative('Exam on 29 November 2026')).toBe(false)
  })
})

describe('validateSchedule', () => {
  it('passes real GATE 2027 dates (registration in 2026, exam in 2027)', () => {
    expect(validateSchedule(2027, {
      registration_start: '2026-09-02', registration_end: '2026-10-12',
      exam_date_start: '2027-02-06', exam_date_end: '2027-02-21', result_date: '2027-03-19',
    }, TODAY)).toEqual([])
  })
  it('catches the bad rows that were in the database', () => {
    // GATE 2027 row: registration in Aug 2027 for a Feb 2027 exam
    expect(validateSchedule(2027, { registration_start: '2027-08-14', registration_end: '2027-09-21', exam_date_start: '2027-02-06', result_date: '2027-03-16' }, TODAY))
      .toContain('registration ends after the exam starts')
    // CAT 2027 row: result before exam
    expect(validateSchedule(2027, { exam_date_start: '2027-11-24', result_date: '2027-01-05' }, TODAY))
      .toContain('result is before the exam')
    // GATE "2026" row holding 2027 exam dates
    expect(validateSchedule(2026, { exam_date_start: '2027-02-01' }, TODAY)[0]).toMatch(/does not match cycle year/)
  })
})

describe('validateScholarship', () => {
  it('rejects stale deadlines and inverted amounts', () => {
    expect(validateScholarship({ application_deadline: '2024-12-31' }, TODAY)[0]).toMatch(/past/)
    expect(validateScholarship({ amount_min: 50000, amount_max: 10000 }, TODAY)).toContain('amount_min > amount_max')
    expect(validateScholarship({ application_deadline: '2026-12-31', amount_min: 12000, amount_max: 20000 }, TODAY)).toEqual([])
  })
})

describe('normalizeSession', () => {
  it('maps naming variants onto existing session rows', () => {
    expect(normalizeSession(null, [])).toBe('Default')
    expect(normalizeSession('Session-I', [])).toBe('Session 1')
    expect(normalizeSession('Phase 2', [])).toBe('Session 2')
    expect(normalizeSession('January session', ['Session 2'])).toBe('Session 1')
    expect(normalizeSession('April 2027', ['Session 1'])).toBe('Session 2')
    expect(normalizeSession('session 1', ['Session 1'])).toBe('Session 1')
  })
  it('keeps month-named sittings for exams held several times a year', () => {
    expect(normalizeSession('January 2027', [])).toBe('January')
    expect(normalizeSession('May 2027 attempt', ['January'])).toBe('May')
    expect(normalizeSession('Sept. exam', [])).toBe('September')
    expect(normalizeSession('NDA (II) 2027', [])).toBe('NDA (II)')
  })
})

describe('isOfficialUrl', () => {
  it('trusts own and government/academic domains, never aggregators', () => {
    expect(isOfficialUrl('https://jeemain.nta.nic.in/notice.pdf', ['https://jeemain.nta.nic.in'])).toBe(true)
    expect(isOfficialUrl('https://gate2027.iitm.ac.in/dates', ['https://gate2027.iitm.ac.in'])).toBe(true)
    expect(isOfficialUrl('https://iimcat.ac.in/per/g01/pub/', ['https://iimcat.ac.in'])).toBe(true)
    expect(isOfficialUrl('https://scholarships.reliancefoundation.org/x', ['https://scholarships.reliancefoundation.org'])).toBe(true)
    expect(isOfficialUrl('https://www.shiksha.com/news/jee', ['https://jeemain.nta.nic.in'])).toBe(false)
    expect(isOfficialUrl('https://random-blog.com/jee', ['https://jeemain.nta.nic.in'])).toBe(false)
  })
})

describe('focusText', () => {
  it('keeps date lines and drops boilerplate', () => {
    const text = ['Home', 'About us', 'Gallery', 'Last date to apply: 22 November 2026', 'Contact', ...Array(50).fill('menu item')].join('\n')
    const out = focusText(text, /apply/i)
    expect(out).toContain('22 November 2026')
    expect(out.split('\n').length).toBeLessThan(10)
  })
})

describe('NIRF', () => {
  it('canonicalises abbreviations so DB names match NIRF names', () => {
    expect(canonName('IIT Madras')).toBe(canonName('Indian Institute of Technology Madras'))
    expect(canonName('The Indian Institute of Science')).toBe(canonName('IISc'))
    expect(canonName('IIT Bombay')).not.toBe(canonName('IIT Delhi'))
  })
  it('parses ranked tables by header name and skips rank bands', () => {
    const html = `<table><thead><tr><th>Institute ID</th><th>Name</th><th>City</th><th>State</th><th>Score</th><th>Rank</th></tr></thead>
      <tbody>
        <tr><td>IR-E-U-0456</td><td>Indian Institute of Technology Madras<div>More Details</div></td><td>Chennai</td><td>Tamil Nadu</td><td>88.72</td><td>1</td></tr>
        <tr><td>IR-E-I-1074</td><td>Indian Institute of Technology Delhi</td><td>New Delhi</td><td>Delhi</td><td>86.12</td><td>2</td></tr>
        <tr><td>IR-E-X</td><td>Some College</td><td>Pune</td><td>Maharashtra</td><td>40.1</td><td>101-150</td></tr>
      </tbody></table>`
    const rows = parseNirfTable(html)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ name: 'Indian Institute of Technology Madras', city: 'Chennai', rank: 1, score: 88.72 })
  })
  it('returns nothing (not garbage) when the format changes', () => {
    expect(parseNirfTable('<table><tr><td>1</td><td>x</td></tr></table>')).toEqual([])
  })
  it('does not give a faculty or institute its parent university\'s rank', () => {
    expect(looseNameMatch('Banaras Hindu University Faculty of Law', 'Banaras Hindu University', 'Varanasi')).toBe(false)
    expect(looseNameMatch('Institute of Technology, Nirma University', 'Nirma University', 'Ahmedabad')).toBe(false)
    expect(looseNameMatch('Institute of Engineering and Management, Kolkata', 'Institute of Engineering & Management', 'Kolkata')).toBe(true)
    expect(looseNameMatch('IIITDM Jabalpur', 'Pandit Dwarka Prasad Mishra IIITDM Jabalpur', 'Jabalpur')).toBe(true)
  })
  it('counts an institute repeated across tables once', () => {
    const r = { name: 'Bangalore University', city: 'Bengaluru', state: 'Karnataka', rank: 65, score: null }
    expect(dedupe([r, { ...r }, { ...r }])).toHaveLength(1)
  })
  it('reads a band page (no rank column) with the band it was asked for', () => {
    const html = `<table><thead><tr><th>Institute ID</th><th>Name</th><th>City</th><th>State</th></tr></thead>
      <tbody><tr><td>IR-E-C-1</td><td>R.V. College of Engineering<div>More Details</div></td><td>Bengaluru</td><td>Karnataka</td></tr></tbody></table>`
    expect(parseNirfTable(html, '101-150')).toEqual([
      { name: 'R.V. College of Engineering', city: 'Bengaluru', state: 'Karnataka', rank: null, band: '101-150', score: null },
    ])
    expect(parseNirfTable(html)).toEqual([]) // without a band, a table with no rank column is not read
  })
})

import { parseRobots, robotsAllows } from './http'

describe('robots.txt', () => {
  const txt = `User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /

User-agent: *
Disallow: /*/raw/
Disallow: /search$
Disallow: /admin
Allow: /admin/public

User-agent: BadBot
Disallow: /`
  const rules = parseRobots(txt)
  it('uses the * group and ignores groups for other bots', () => {
    expect(robotsAllows(rules, '/notices/jee-main-2027.pdf')).toBe(true)
    expect(robotsAllows(rules, '/')).toBe(true)
  })
  it('handles wildcards, $ anchors and Allow overrides', () => {
    expect(robotsAllows(rules, '/org/repo/raw/file')).toBe(false)
    expect(robotsAllows(rules, '/search')).toBe(false)
    expect(robotsAllows(rules, '/search/advanced')).toBe(true)
    expect(robotsAllows(rules, '/admin/secret')).toBe(false)
    expect(robotsAllows(rules, '/admin/public/dates')).toBe(true)
  })
  it('empty Disallow allows everything', () => {
    expect(robotsAllows(parseRobots('User-agent: *\nDisallow:'), '/anything')).toBe(true)
  })
})

describe('college evidence', () => {
  it('accepts only the exact NAAC grade in the quote', () => {
    expect(quoteSupportsGrade('A++', 'Accredited by NAAC with A++ Grade')).toBe(true)
    expect(quoteSupportsGrade('A+', 'Accredited by NAAC with A++ Grade')).toBe(false)
    expect(quoteSupportsGrade('A', 'NAAC Accredited with Grade A + (CGPA 3.3)')).toBe(false)
    expect(quoteSupportsGrade('A+', 'NAAC Accredited with Grade A + (CGPA 3.3)')).toBe(true)
    expect(quoteSupportsGrade('A', "NAAC 'A' grade institution")).toBe(true)
    expect(quoteSupportsGrade('A++', 'NBA accredited A++ programmes')).toBe(false)
  })
  it('needs a founding word next to the year', () => {
    expect(quoteSupportsYear(1959, 'IIT Bombay was established in 1959')).toBe(true)
    expect(quoteSupportsYear(1959, 'Admissions 1959 batch reunion')).toBe(false)
  })
})

describe('PDF line rebuilding', () => {
  // [a, b, c, d, x, y] text matrices, as pdf.js reports them
  const w = (str: string, x: number, y: number, rotated = false) => ({ str, transform: rotated ? [0, -8, 8, 0, x, y] : [8, 0, 0, 8, x, y] })
  it('joins words on the same baseline, top line first', () => {
    const items = [w('2027', 120, 500), w('January', 60, 500), w('Date', 10, 700), w('20', 40, 500), w('of', 40, 700)]
    expect(itemsToLines(items)).toBe('Date of\n20 January 2027')
  })
  it('handles pages rotated 90 degrees (text running down the page)', () => {
    const items = [w('Examination', 731, 400, true), w('Date', 731, 480, true), w('January', 704, 300, true), w('20', 704, 470, true)]
    expect(itemsToLines(items)).toBe('Date Examination\n20 January')
  })
})

describe('college detail evidence', () => {
  it('ties a fee quote to its programme', () => {
    expect(quoteNamesCourse('B.Tech Computer Science', 'B. Tech (all branches): Rs. 2,25,000 per annum')).toBe(true)
    expect(quoteNamesCourse('MBA', 'MBA Programme fee ₹ 12,50,000 (two years)')).toBe(true)
    expect(quoteNamesCourse('B.A. Economics', 'Tuition for Bachelor programmes: ₹ 40,000')).toBe(false)
    expect(quoteNamesCourse('M.Sc Biotechnology', 'Biotechnology (M.Sc.) Rs 60,000/year')).toBe(true)
    expect(quoteNamesCourse('MBA', 'M.Tech fee ₹1,40,000')).toBe(false)
  })
  it('ties a fee-table row to the programme heading above it', () => {
    const page = 'FEES STRUCTURE FOR 2026\nCOURSE: B.Tech. CATEGORY: OPEN\nSEMESTER I II\nTuition Fee 62500 62500\nTotal 1,25,550\n'
      + 'COURSE: B.Arch. CATEGORY: OPEN\nSEMESTER I II\nTuition Fee 70000 70000\n'
    expect(headedByCourse('B.Tech', 'Tuition Fee 62500 62500', page)).toBe(true)
    expect(headedByCourse('B.Arch', 'Tuition Fee 70000 70000', page)).toBe(true)
    expect(headedByCourse('B.Arch', 'Tuition Fee 62500 62500', page)).toBe(false)
    expect(headedByCourse('MBA', 'Tuition Fee 62500', 'Hostel fee schedule\nTuition Fee 62500')).toBe(false)
    expect(semesterColumns('Tuition Fee 62500 62500', page)).toBe(true)
    expect(semesterColumns('Annual tuition 1,25,000', 'SEMESTER I II\nAnnual tuition 1,25,000')).toBe(false)
    expect(semesterColumns('Tuition Fee 2,00,000', 'YEAR I II\nTuition Fee 2,00,000')).toBe(false)
  })
  // NIT Trichy's B.Tech 2026 fee PDF, as the reader's PDF text comes out. On 18 Nov 2026 the AI
  // quoted the table from its heading, so the semester header sat inside the quote, and ₹62,500
  // (one semester) was stored as the yearly fee over the verified ₹1,52,750.
  const nitt = 'ACADEMIC OFFICE / FEES SECTION\nNATIONAL INSTITUTE OF TECHNOLOGY\nTIRUCHIRAPPALLI - 620 015 , TAMIL NADU, INDIA\n'
    + 'INSTITUTE FEES STRUCTURE FOR 2026 ADMISSION BATCH\nCOURSE: B.Tech. CATEGORY: OPEN/OPEN-EWS/OBC-NCL/ICCR/DASA (CIWG)\n'
    + 'Sl.No. SEMESTER I II III IV V VI VII VIII\n1 Tuition Fee 62500 62500 62500 62500 62500 62500 62500 62500\nAnnual Fee\n'
    + '1 Computer Fee 3200 -- 3500 -- 3850 -- 4250 --\nTotal Annual Fee 27750 -- 30450 -- 33450 -- 36800 --\n'
    + 'TOTAL 1,25,550 62,500 92,950 62,500 95,950 62,500 99,300 62,500\n'
  it('reads a semester-wise fee table whose header is inside the quote (NIT Trichy 2026)', () => {
    const fromHeading = 'COURSE: B.Tech. CATEGORY: OPEN/OPEN-EWS/OBC-NCL/ICCR/DASA (CIWG)\nSl.No. SEMESTER I II III IV V VI VII VIII\n1 Tuition Fee 62500 62500 62500 62500 62500 62500 62500 62500'
    expect(semesterColumns(fromHeading, nitt)).toBe(true)
    expect(quoteNamesCourse('B.Tech.', fromHeading)).toBe(true) // the heading is in the quote itself
    // Just the row, header above it
    expect(semesterColumns('Tuition Fee 62500 62500 62500 62500 62500 62500 62500 62500', nitt)).toBe(true)
    expect(headedByCourse('B.Tech.', 'Tuition Fee 62500 62500 62500 62500 62500 62500 62500 62500', nitt)).toBe(true)
    // A quote that says "annual" is a yearly figure, header or not
    expect(semesterColumns('Total Annual Fee 27750 -- 30450', nitt)).toBe(false)
  })
  it('adds the first year\'s annual charges from the same semester table (NIT Trichy 2026: 2 × 62,500 + 27,750)', () => {
    const row = 'Tuition Fee 62500 62500 62500 62500 62500 62500 62500 62500'
    const fromHeading = 'COURSE: B.Tech. CATEGORY: OPEN/OPEN-EWS/OBC-NCL/ICCR/DASA (CIWG)\nSl.No. SEMESTER I II III IV V VI VII VIII\n1 Tuition Fee 62500 62500 62500 62500 62500 62500 62500 62500'
    expect(annualCharges(row, nitt)).toEqual({ value: 27750, row: 'Total Annual Fee 27750 -- 30450 -- 33450 -- 36800 --' })
    expect(annualCharges(fromHeading, nitt)?.value).toBe(27750)
    expect(2 * 62500 + annualCharges(row, nitt)!.value).toBe(152750)
    expect(semesterFeeNote(62500, 27750)).toBe('₹62,500 tuition each semester + ₹27,750 annual fee (official)')
    // The reader's own note is not a hand check
    expect(handVerifiedFee('2026-11-21T00:00:00Z', semesterFeeNote(62500, 27750))).toBe(false)

    // Charges belong to the table they sit in: the next programme's table never contributes
    const noCharges = 'COURSE: B.Tech.\nSEMESTER I II\n1 Tuition Fee 62500 62500\nTOTAL 62500 62500\nCOURSE: M.Tech.\nSEMESTER I II\n1 Tuition Fee 70000 70000\nTotal Annual Fee 20000 --\n'
    expect(annualCharges('Tuition Fee 62500 62500', noCharges)).toBeNull()
    // The same tuition row in two tables: which charges apply is unclear, so none are added
    const twice = 'COURSE: B.Tech.\nSEMESTER I II\n1 Tuition Fee 62500 62500\nTotal Annual Fee 27750 --\nCOURSE: B.Arch.\nSEMESTER I II\n1 Tuition Fee 62500 62500\nTotal Annual Fee 30000 --\n'
    expect(annualCharges('Tuition Fee 62500 62500', twice)).toBeNull()
    // No semester header: not a semester table, nothing to add
    expect(annualCharges('Tuition Fee 62500', 'Tuition Fee 62500\nTotal Annual Fee 27750\n')).toBeNull()
  })
  it('keeps hand-verified fees from being replaced without review', () => {
    const note = 'B.Tech first year (2026 batch, open category): ₹62,500 tuition each semester + ₹27,750 annual fee'
    expect(handVerifiedFee('2026-11-18T19:26:15Z', note)).toBe(true)
    expect(handVerifiedFee(null, note)).toBe(false)
    expect(handVerifiedFee('2026-11-18T19:26:15Z', null)).toBe(false)
    // Notes the automation writes itself are not hand checks
    expect(handVerifiedFee('2026-11-18T19:26:15Z', 'Tuition per year across 1 programme, from the official fee schedule')).toBe(false)
    expect(handVerifiedFee('2026-11-18T19:26:15Z', '₹62,500 per semester (official)')).toBe(false)

    const stored = { verifiedAt: '2026-11-18T19:26:15Z', note, min: 152750, max: 152750 }
    // One semester's tuition: under half, always waits for review
    const semester = verifiedFeeGuard(stored, { min: 62500, max: 62500 })
    expect(semester.overwritesVerified).toBe(true)
    expect(semester.forceReview).toMatch(/under half the hand-verified ₹1,52,750/)
    // Tuition for the year without the annual charges: a change to a verified fee, held under the safe policy
    expect(verifiedFeeGuard(stored, { min: 125000, max: 125000 })).toEqual({ overwritesVerified: true })
    // IIM Ranchi: a range collapsing to its lower end is still a change to verified data
    const ranchi = { verifiedAt: '2026-11-18T19:15:02Z', note: 'MBA 2026-28: ₹9,75,000 in year 1 and ₹9,45,000 in year 2', min: 945000, max: 975000 }
    expect(verifiedFeeGuard(ranchi, { min: 945000, max: 945000 })).toEqual({ overwritesVerified: true })
    expect(verifiedFeeGuard(ranchi, { min: 945000, max: 472500 - 1 }).forceReview).toBeTruthy()
    // Nothing checked by hand: the reading may fill or refresh the fee as before
    expect(verifiedFeeGuard({ verifiedAt: null, note: null, min: 150000 }, { min: 62500 })).toEqual({ overwritesVerified: false })
  })
  it('ties a placement figure to its season', () => {
    expect(quoteNamesYear(2024, 'Placement 2023-24: highest CTC 1.2 Cr')).toBe(true)
    expect(quoteNamesYear(2024, 'Batch 2024 average package 18.5 LPA')).toBe(true)
    expect(quoteNamesYear(2024, 'Highest package 1.2 Cr in 2022-23')).toBe(false)
  })
})

describe('JoSAA institute matching', () => {
  const josaa = [
    'Indian Institute of Information Technology, Agartala',
    'National Institute of Electronics and Information Technology, Agartala',
    'Indian Institute of Information Technology(IIIT), Vadodara, Gujrat',
    'Indian Institute of Information Technology, Vadodara International Campus Diu (IIITVICD)',
    'Pt. Dwarka Prasad Mishra Indian Institute of Information Technology, Design & Manufacture Jabalpur',
    'Birla Institute of Technology, Mesra, Ranchi',
    'Birla Institute of Technology, Patna Off-Campus',
    'Institute of Chemical Technology, Mumbai: Indian Oil Odisha Campus, Bhubaneswar',
    'National Institute of Technology, Tiruchirappalli',
    'Indian Institute of Information Technology Tiruchirappalli',
    'Indian Institute of Technology (BHU) Varanasi',
    'Indian Institute of Technology (ISM) Dhanbad',
    'National Institute of Technology, Srinagar',
    'National Institute of Technology, Uttarakhand',
  ]
  const m = (name: string, city: string) => matchInstitute({ name, city }, josaa)
  it('matches by type plus distinguishing word or city', () => {
    expect(m('National Institute of Technology Trichy', 'Tiruchirappalli')).toBe('National Institute of Technology, Tiruchirappalli')
    expect(m('Indian Institute of Information Technology (IIIT) Tiruchirappalli', 'Tiruchirappalli')).toBe('Indian Institute of Information Technology Tiruchirappalli')
    expect(m('Indian Institute of Technology BHU', 'Varanasi')).toBe('Indian Institute of Technology (BHU) Varanasi')
    expect(m('Indian Institute of Technology Dhanbad', 'Dhanbad')).toBe('Indian Institute of Technology (ISM) Dhanbad')
    expect(m('National Institute of Technology Uttarakhand', 'Srinagar (Garhwal)')).toBe('National Institute of Technology, Uttarakhand')
  })
  it('handles NIELIT, extra campuses and spelling variants', () => {
    expect(m('Indian Institute of Information Technology (IIIT) Agartala', 'Agartala')).toBe('Indian Institute of Information Technology, Agartala')
    expect(m('Indian Institute of Information Technology (IIIT) Vadodara', 'Vadodara')).toBe('Indian Institute of Information Technology(IIIT), Vadodara, Gujrat')
    expect(m('Indian Institute of Information Technology, Design and Manufacturing (IIITDM) Jabalpur', 'Jabalpur')).toMatch(/Jabalpur$/)
    expect(m('Birla Institute of Technology Mesra', 'Ranchi')).toBe('Birla Institute of Technology, Mesra, Ranchi')
  })
  it('never matches a different campus or a one-word guess', () => {
    expect(m('Institute of Chemical Technology Mumbai', 'Mumbai')).toBeNull()
    expect(m('Institute of Technology, Nirma University', 'Ahmedabad')).toBeNull()
  })
})

describe('programme names', () => {
  it('rejects application rounds and entrance tests', () => {
    for (const n of ['B.Tech Foreign 2026 (December session)', 'VITREE-2027 (Ph.D.)', 'VITEEE', 'MBA Admission Notification', 'Entrance Test for M.Sc'])
      expect(isNotAProgramme(n)).toBe(true)
  })
  it('keeps real programmes', () => {
    for (const n of ['MBA-PGPX', 'One Year MBA', 'Executive MBA', 'B.Tech Computer Science and Engineering', 'M.Sc. Biotechnology', 'Ph.D.', 'B.Arch', 'Integrated M.Tech (Software Engineering)', '5 Year BS-MS Dual Degree Programme'])
      expect(isNotAProgramme(n)).toBe(false)
  })
  it('drops "Admission in" around a programme name', () => {
    expect(programmeName('Admission in Master of Science Programme')).toBe('Master of Science Programme')
    expect(programmeName('Integrated PhD Admission')).toBe('Integrated PhD')
    expect(isNotAProgramme(programmeName('PhD Admission Spring 2027'))).toBe(true)
  })
  it('cleans names the colleges list programmes under', () => {
    expect(programmeName('M.Tech Programmes')).toBe('M.Tech')
    expect(programmeName('BTECH (UG)')).toBe('BTECH')
    expect(programmeName('Doctoral Programme in Management ( PhD)')).toBe('Doctoral Programme in Management (PhD)')
    expect(isNotAProgramme('FYUG Programmes in the Teaching Departments')).toBe(true)
    expect(isNotAProgramme(programmeName('COURSE: BTech Lateral Entry CE All India Merit (SOE, Thrikkakkara)'))).toBe(true)
    expect(degreeType('PhD (PG)', 'PG')).toBe('Doctoral')
    expect(degreeType('MBA', 'PG')).toBe('Postgraduate')
  })
  it('drops a trailing "Programme" only after a degree', () => {
    expect(programmeName('B.Tech. Programme')).toBe('B.Tech.')
    expect(programmeName('M.sc. Programme')).toBe('M.sc.')
    expect(programmeName('Doctoral Programme')).toBe('Doctoral Programme')
  })
  it('swaps the www form of a college site', () => {
    expect(otherWww('https://www.hau.ac.in/')).toBe('https://hau.ac.in/')
    expect(otherWww('https://nitdgp.ac.in/')).toBe('https://www.nitdgp.ac.in/')
  })
})

describe('syllabus evidence', () => {
  it('needs the unit title in its quote', () => {
    expect(quoteNamesTopic('Laws of Motion', 'UNIT 3: LAWS OF MOTION Newton’s first law')).toBe(true)
    expect(quoteNamesTopic('Rotational Motion', 'UNIT 3: LAWS OF MOTION')).toBe(false)
  })
  it('finds the syllabus inside a long bulletin, not its table of contents', () => {
    const toc = 'Contents\nSyllabus ........ 40\nFees ........ 12\n'
    const body = `${'x'.repeat(5000)}\nSYLLABUS\nUnit 1 Sets\nUnit 2 Relations\nUnit 3 Limits\nChapter 4 Vectors\n`
    expect(syllabusSection(toc + body, 200)).toContain('Unit 1 Sets')
  })
})

describe('exam cutoff evidence', () => {
  it('needs the category in the quote', () => {
    expect(quoteNamesCategory('UR', 'UR 93.1023262')).toBe(true)
    expect(quoteNamesCategory('OBC-NCL', 'OBC-NCL 79.4313582')).toBe(true)
    expect(quoteNamesCategory('SC', 'ST 47.9026465')).toBe(false)
  })
  it('counts cutoff table rows, not years', () => {
    expect(cutoffLines('UR 93.10\nEWS 80.38\nSC 61.15\nNotice 2026')).toBe(3)
    expect(cutoffLines('Results of NEET (UG) 2026 for SC/ST candidates')).toBe(0)
  })
})

describe('htmlToText', () => {
  it('drops struck-out (superseded) dates', () => {
    const $ = load('<table><tr><td>Opening Date</td><td><del>14th August 2026</del><br><del>27th August 2026</del><br>2nd September 2026</td></tr></table>')
    const text = htmlToText($)
    expect(text).toContain('2nd September 2026')
    expect(text).not.toContain('14th August')
  })
})

describe('career facts', () => {
  const page = (url: string, text: string) => ({ url, finalUrl: url, status: 200, kind: 'html' as const, text, hash: url, links: [] })
  it('drops menu lines repeated on every page of a site', () => {
    const menu = 'NISM-Series-VIII: Equity Derivatives Certification Examination for market staff'
    const ctx = careerContext([
      page('https://a.in/1', `${menu}\nAll Research Analysts must be registered with SEBI and follow strict guidelines.`),
      page('https://a.in/2', `${menu}\nSome other page text about something else entirely, long enough.`),
    ], /Research\W*Analyst/i)
    expect(ctx).toContain('must be registered with SEBI')
    expect(ctx).not.toContain('Equity Derivatives')
  })
  it('keeps sentences, not menu items or notices', () => {
    expect(usableSentence('A candidate should have passed Class 10 or equivalent from a recognized Board.')).toBe(true)
    expect(usableSentence('Click here to download the form')).toBe(false)
    expect(usableSentence('Admission')).toBe(false)
  })
})

describe('career sentences from PDFs', () => {
  it('rejects cut-off table cells, schedules and renewal rules', () => {
    expect(usableSentence('Qualification from a recognized Board, or university')).toBe(false)
    expect(usableSentence('Electrician) Qualification trades like Masonry or Electrician.')).toBe(false)
    expect(usableSentence('Online Examination – Preliminary August, 2026')).toBe(false)
    expect(usableSentence('In order to successfully complete the renewal examination (X-C), a candidate has to pass')).toBe(false)
    expect(usableSentence("Eligibility Criteria: Bachelor's Degree or equivalent in any discipline")).toBe(true)
  })
})

describe('placement tables', () => {
  const page = [
    'Placement Statistics:',
    '2020 | 2021 | 2022 | 2023 | 2024',
    'Highest CTC (INR Lakhs per annum) | 41.3 | 36.3 | 42.5 | 52 | 83',
    'Average CTC (INR Lakhs per annum) | 23.2 | 24.6 | 26.4 | 30 | 30',
    'Total offers | - | 61 | 64 | 60 | 69',
  ].join('\n')

  it('reads each year column in rupees', () => {
    const f = placementTable(page)
    expect(f.find((x) => x.year === 2024 && x.metric === 'highest')?.value).toBe(8_300_000)
    expect(f.find((x) => x.year === 2021 && x.metric === 'average')?.value).toBe(2_460_000)
    expect(f).toHaveLength(10)
  })

  it('takes season headers as the year they end, after a label cell', () => {
    const f = placementTable('Year | 2022-23 | 2023-24\nMedian Package (LPA) | 12 | 14.5')
    expect(f.map((x) => [x.year, x.value])).toEqual([[2023, 1_200_000], [2024, 1_450_000]])
  })

  it('skips rows with no unit, or with a different number of columns', () => {
    expect(placementTable('2023 | 2024\nAverage CTC | 30 | 32')).toEqual([])
    expect(placementTable('2023 | 2024\nAverage CTC (LPA) | 30')).toEqual([])
  })
})

describe('placement figure names', () => {
  it('needs the quote to say which figure it is', () => {
    expect(quoteNamesMetric('highest', '2025-26 10 placed Package: 4.5 LPA')).toBe(false)
    expect(quoteNamesMetric('highest', 'Highest CTC 2025: 45 LPA')).toBe(true)
    expect(quoteNamesMetric('average', 'The average annual salary this year stands at INR 33 lakhs')).toBe(true)
    expect(quoteNamesMetric('median', 'Average CTC 2025: 12 LPA')).toBe(false)
    expect(quoteNamesMetric('placed', '120 students placed in 2025')).toBe(true)
  })
})

describe('college labels', () => {
  it('uses the levels the college page groups by', () => {
    expect(degreeType('B.Tech Computer Science', 'UG')).toBe('Undergraduate')
    expect(degreeType('MBA', 'PG')).toBe('Postgraduate')
    expect(degreeType('PhD in Physics', 'PG')).toBe('Doctoral')
    expect(degreeType('Diploma in Nursing', 'Diploma')).toBe('Diploma')
  })

  it('reads the admission process only from general admission pages', () => {
    for (const url of [
      'https://iith.ac.in/phdadmissions/',
      'https://www.iitk.ac.in/kss/data/KSS_PhD_Walk_in_interview_Advertisement-27-11-25.pdf',
      'https://ouat.ac.in/wp-content/uploads/2026/11/2nd-spot-counselling-and-adm.pdf',
      'https://iimidr.ac.in/programmes/academic-programmes/post-graduate-programme-in-management-for-executives-pgpmx/admission/',
      'https://people.iitism.ac.in/~download/files/IIT%20(ISM)%20Foreign%20students%20Admission%20Guidelines%20from%202022%20onwards.pdf',
      'https://ihmkolkata.org/bihar-bed-spot-admission-2024/',
      'https://assets.iiitdwd.ac.in/docs/Physical_reporting_2026.pdf',
      'https://bmsce.ac.in/website_notifications/26-27_BMSCE-MBA_PRE_ADMISSION_APPL_FORM.pdf',
      'https://www.mnlumumbai.edu.in/pdf/Admission2026/Notification-%202nd%20Entrance%20Test%20LLM%20Executive%202026-27.pdf',
    ]) expect(narrowAdmissionPage(url)).toBe(true)
    for (const url of [
      'https://iiitl.ac.in/index.php/admission-in-b-tech-through-jossa-csab-2022/', // old slug, current page
      'https://acad.iitb.ac.in/admissions/bachelors',
      'https://mnit.ac.in/students/admissions',
      'https://www.jnu.ac.in/sites/default/files/admission/e-Prospectus-UG-COP-2026-27.pdf',
      'https://www.iimkashipur.ac.in/academics/mba/mba-admission',
    ]) expect(narrowAdmissionPage(url)).toBe(false)
  })

  it('does not take candidate lists or notice headings as admission steps', () => {
    expect(NOT_A_STEP.test('List of provisionally admitted candidates on State Quota Seats after Second round of counselling')).toBe(true)
    expect(NOT_A_STEP.test('Important notice regarding Counseling and reporting')).toBe(true)
    expect(NOT_A_STEP.test('Admission to the BS-MS programme is through the IISER Aptitude Test.')).toBe(false)
  })

  it('matches common short names to NIRF names', () => {
    expect(canonName('BITS Pilani')).toBe(canonName('Birla Institute of Technology & Science -Pilani'))
    expect(canonName('National Institute of Technology Trichy')).toBe(canonName('National Institute of Technology Tiruchirappalli'))
  })
})

describe('finding an exam\'s own links', () => {
  const links = [
    { text: 'Score Card for CUET (UG) 2026', url: 'https://cuet.nta.nic.in/score-card-for-cuetug-2026/' },
    { text: 'Syllabus', url: 'https://cuet.nta.nic.in/cuetug-2026-syllabus/' },
    { text: 'Syllabus', url: 'https://cuet.nta.nic.in/syllabus/' },
    { text: 'Syllabus for NEET (UG)-2026', url: 'https://cuet.nta.nic.in/neet-syllabus.pdf' },
  ]
  const page = { url: 'https://cuet.nta.nic.in/', finalUrl: 'https://cuet.nta.nic.in/', status: 200, kind: 'html' as const, text: '', hash: '', links }
  const SYL = /syllabus/i

  it('takes a link whose address names the exam', () => {
    expect(relevantLinks(page, 2, SYL, examNamePattern('CUET UG'))[0]).toBe('https://cuet.nta.nic.in/cuetug-2026-syllabus/')
  })

  it('on the exam\'s own site, a plain "Syllabus" link counts', () => {
    const shared = relevantLinks(page, 4, SYL, examNamePattern('CUET UG'))
    const own = relevantLinks(page, 4, SYL, { ...examNamePattern('CUET UG'), ownHost: 'cuet.nta.nic.in' })
    expect(shared).not.toContain('https://cuet.nta.nic.in/syllabus/')
    expect(own).toContain('https://cuet.nta.nic.in/syllabus/')
  })

  it('treats a site as the exam\'s own only when no other exam uses it', () => {
    const all = ['https://cuet.nta.nic.in', 'https://upsc.gov.in', 'https://upsc.gov.in', 'https://nta.ac.in/']
    expect(soleHost('https://cuet.nta.nic.in', all)).toBe('cuet.nta.nic.in')
    expect(soleHost('https://upsc.gov.in', all)).toBeUndefined()
    expect(soleHost(null, all)).toBeUndefined()
  })
})

describe('career facts already on file', () => {
  const old = [{ text: 'Minimum Age shall be 21 years (completed) as on 01.08.2025.' }, { text: 'Maximum age shall not be more than 30 years as on 01.08.2025.' }]
  it('confirms a value when the new read only has fewer or merged sentences', () => {
    expect(addsNothing(old, [{ text: 'Minimum Age shall be 21 years (completed) as on 01.08.2025.' }])).toBe(true)
    expect(addsNothing(old, [{ text: 'Age Minimum Age shall be 21 years (completed) as on 01.08.2025. Maximum age shall not be more than 30 years as on 01.08.2025.' }])).toBe(false)
    expect(addsNothing('All Research Analysts must be registered with SEBI and follow strict guidelines.', 'All Research Analysts must be registered with SEBI')).toBe(true)
  })
  it('still proposes a sentence that is new', () => {
    expect(addsNothing(old, [{ text: 'Candidates must hold a graduate degree.' }])).toBe(false)
    expect(addsNothing(null, [{ text: 'Candidates must hold a graduate degree.' }])).toBe(false)
  })
})
