import { quoteNamesTopic, syllabusSection } from './syllabus'
import { quoteNamesCategory, cutoffLines } from './exam-cutoffs'
import { describe, it, expect } from 'vitest'
import { normalize, quoteOnPage, quoteSupportsDate, quoteSupportsNumber, isTentative } from './evidence'
import { validateSchedule, validateScholarship } from './validate'
import { normalizeSession } from './exams'
import { quoteSupportsGrade, quoteSupportsYear } from './colleges'
import { degreeType, isNotAProgramme, otherWww, programmeName, quoteNamesCourse, quoteNamesYear } from './college-details'
import { matchInstitute } from './josaa'
import { canonName, parseNirfTable } from './nirf'
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
    expect(degreeType('MBA', 'PG')).toBe('PG')
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
