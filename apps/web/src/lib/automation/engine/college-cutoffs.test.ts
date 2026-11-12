import { describe, it, expect } from 'vitest'
import { distinctWords, matchExam, namesCollege } from './college-cutoffs'

const exams = [
  { id: '1', name: 'NEET UG', slug: 'neet-ug', official_url: null, source_urls: null },
  { id: '2', name: 'NEET PG', slug: 'neet-pg', official_url: null, source_urls: null },
  { id: '3', name: 'KCET', slug: 'kcet', official_url: null, source_urls: null },
  { id: '4', name: 'CUET UG', slug: 'cuet-ug', official_url: null, source_urls: null },
]

describe('college cutoff reader', () => {
  it('keeps the words that tell a college apart, not its city or generic words', () => {
    expect(distinctWords('University Visvesvaraya College of Engineering', 'Bengaluru')).toEqual(['visvesvaraya'])
    expect(distinctWords('Ramaiah Institute of Technology', 'Bangalore')).toEqual(['ramaiah'])
  })

  it('accepts a counselling-list row only when it names this college', () => {
    const words = distinctWords('University Visvesvaraya College of Engineering', 'Bengaluru')
    expect(namesCollege('E001 University Visvesvaraya College of Engineering Bangalore CS 2AG 1234', words)).toBe(true)
    expect(namesCollege('E005 RV College of Engineering Bangalore CS 2AG 1234', words)).toBe(false)
  })

  it('matches the exam the notice names', () => {
    expect(matchExam('KCET 2025', exams)?.slug).toBe('kcet')
    expect(matchExam('NEET-UG 2025 counselling', exams)?.slug).toBe('neet-ug')
    expect(matchExam('NEET PG', exams)?.slug).toBe('neet-pg')
    expect(matchExam('JEE Main', exams)).toBeNull()
  })
})

describe('batch year of an admission document', () => {
  it('reads the admitted batch from the title or file name', async () => {
    const { batchYear } = await import('./college-cutoffs')
    expect(batchYear('https://www.iimrohtak.ac.in/panel/assets/images/admission-policy/pgpadmissionpolicy2025-27.pdf')).toBe(2025)
    expect(batchYear('PGP Admissions Policy 2026-2028')).toBe(2026)
    expect(batchYear('Policy 2025-27 and 2026-28')).toBeNull()
    expect(batchYear('Notice dated 12-05-2026')).toBeNull()
  })
})
