/* eslint-disable @typescript-eslint/no-explicit-any -- test doubles */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Fake official page
vi.mock('./http', async (orig) => {
  const real = await orig<typeof import('./http')>()
  return {
    ...real,
    fetchPage: vi.fn(async (url: string) => ({
      url, finalUrl: url, status: 200, kind: 'html', hash: 'h1', links: [],
      text: [
        'JEE (Main) 2027 Session 1 (January 2027)',
        'Online Submission of Application Form | 24 October 2026 to 22 November 2026 (up to 11:50 PM)',
        'Dates of Examination | 20, 21, 22, 23, 24 and 28 January 2027',
      ].join('\n'),
    })),
  }
})

// AI that tells the truth for some fields and invents others
vi.mock('./llm', () => ({
  extractJson: vi.fn(async () => ({
    cycles: [{
      year: 2027, session: 'Session 1', tentative: false,
      registration_start: { value: '2026-10-24', quote: '24 October 2026 to 22 November 2026' },
      registration_end: { value: '2026-11-22', quote: '24 October 2026 to 22 November 2026' },
      exam_date_start: { value: '2027-01-20', quote: '20, 21, 22, 23, 24 and 28 January 2027' },
      exam_date_end: { value: '2027-01-30', quote: '20, 21, 22, 23, 24 and 28 January 2027' }, // wrong date, real quote
      result_date: { value: '2027-02-12', quote: 'Result will be declared on 12 February 2027' }, // invented quote
    },
    { year: 2024, session: null, exam_date_start: { value: '2024-01-24', quote: 'x' } }], // old cycle
  })),
}))

const submitted: any[] = []
vi.mock('./proposals', () => ({
  submitProposal: vi.fn(async (_db: unknown, _run: unknown, p: unknown) => { submitted.push(p); return 'pending' }),
}))

function fakeDb(scheduleRows: any[]) {
  const chain: any = {
    select: () => chain, update: () => chain, eq: () => chain, in: () => chain, upsert: () => chain,
    then: (res: any) => res({ data: chain._data, error: null }),
  }
  return {
    from(table: string) {
      chain._data = table === 'exam_schedules' ? scheduleRows : []
      return chain
    },
  } as any
}

import { updateExam } from './exams'

const exam = { id: 'exam-1', name: 'JEE Main', slug: 'jee-main', official_url: 'https://jeemain.nta.nic.in', source_urls: [] }

describe('updateExam pipeline', () => {
  beforeEach(() => { submitted.length = 0 })

  it('keeps quoted facts, drops invented and mismatched ones', async () => {
    const res = await updateExam(fakeDb([]), exam, { runId: null, dryRun: true, force: true, today: new Date('2026-10-27') })

    expect(submitted).toHaveLength(1) // the 2024 cycle is ignored
    const p = submitted[0]
    expect(Object.keys(p.fields).sort()).toEqual(['exam_date_start', 'registration_end', 'registration_start'])
    expect(p.fields.registration_end.new).toBe('2026-11-22')
    expect(p.insertKey).toEqual({ exam_id: 'exam-1', year: 2027, session: 'Session 1' })
    expect(p.forceReview).toBeUndefined()

    expect(res.dropped.join('\n')).toMatch(/exam_date_end: quote does not contain 2027-01-30/)
    expect(res.dropped.join('\n')).toMatch(/result_date: quote not found on page/)
  })

  it('clears hand-typed guesses the official notice does not confirm', async () => {
    const legacy = {
      id: 'row-9', year: 2027, session: 'Session 1', data_status: 'unverified',
      registration_start: '2026-10-24', registration_end: '2026-11-22',
      exam_date_start: '2027-01-20', exam_date_end: '2027-01-28', result_date: '2027-01-10', // impossible
    }
    await updateExam(fakeDb([legacy]), exam, { runId: null, dryRun: true, force: true, today: new Date('2026-10-27') })
    // Confirmed values match; the unconfirmed end date and the fake result become "Not announced",
    // which leaves a consistent, fully confirmed row
    expect(submitted).toHaveLength(1)
    expect(submitted[0].fields).toEqual({
      exam_date_end: { old: '2027-01-28', new: null, evidence: null },
      result_date: { old: '2027-01-10', new: null, evidence: null },
    })
    expect(submitted[0].forceReview).toBeUndefined()
    expect(submitted[0].extra.data_status).toBe('verified')
  })

  it('routes overwrites of verified data to review', async () => {
    const verified = {
      id: 'row-1', year: 2027, session: 'Session 1', data_status: 'verified',
      registration_start: '2026-10-24', registration_end: '2026-11-15',
      exam_date_start: '2027-01-20', exam_date_end: null, result_date: null,
    }
    await updateExam(fakeDb([verified]), exam, { runId: null, dryRun: true, force: true, today: new Date('2026-10-27') })
    expect(submitted).toHaveLength(1)
    expect(submitted[0].recordId).toBe('row-1')
    expect(submitted[0].fields).toEqual({ registration_end: { old: '2026-11-15', new: '2026-11-22', evidence: '24 October 2026 to 22 November 2026' } })
    expect(submitted[0].overwritesVerified).toBe(true)
  })
})
