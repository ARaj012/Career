import { describe, expect, it } from 'vitest'
import { alertKey, alertLine, dueAlerts, renderDigest, todayIST, type ScheduleIn } from './exam-alerts'

const sched = (over: Partial<ScheduleIn> = {}): ScheduleIn => ({
  exam_id: 'e1', year: 2027, session: 'Default', registration_start: null, registration_end: '2026-11-24',
  exam_date_start: '2027-01-21', result_date: null, data_status: 'verified', ...over,
})

describe('dueAlerts', () => {
  it('fires at the countdown steps and on the day', () => {
    // The exam is 61 days away: past the furthest (60-day) step, so only registration fires
    expect(dueAlerts([sched()], null, '2026-11-21', new Set())).toEqual([
      expect.objectContaining({ event: 'registration_end', daysLeft: 3, threshold: 3, tentative: false }),
    ])
    expect(dueAlerts([sched()], null, '2026-11-24', new Set())[0]).toMatchObject({ daysLeft: 0, threshold: 0 })
  })

  it('sends each step once, and a missed step late', () => {
    const reg = (today: string, sent: Set<string>) => dueAlerts([sched()], null, today, sent).filter((a) => a.event === 'registration_end')
    const sent = new Set(reg('2026-11-21', new Set()).map(alertKey))
    expect(reg('2026-11-22', sent)).toHaveLength(0) // 2 days left: still the 3-day step
    expect(reg('2026-11-23', sent)[0]).toMatchObject({ threshold: 1 })
  })

  it('respects the student’s settings', () => {
    const pref = {
      notify_registration_start: true, notify_registration_end: false, notify_exam_date: true, notify_result: true,
      countdown_reminders: false, countdown_days: null, is_tracking_enabled: true,
    }
    expect(dueAlerts([sched()], pref, '2026-11-24', new Set())).toHaveLength(0)
    expect(dueAlerts([sched()], { ...pref, is_tracking_enabled: false }, '2027-01-21', new Set())).toHaveLength(0)
    expect(dueAlerts([sched()], pref, '2027-01-21', new Set())[0]).toMatchObject({ event: 'exam_date', daysLeft: 0 })
  })

  it('ignores past dates', () => {
    expect(dueAlerts([sched()], null, '2027-02-01', new Set())).toHaveLength(0)
  })
})

describe('messages', () => {
  it('says what happens and when, and flags unconfirmed dates', () => {
    const [a] = dueAlerts([sched({ data_status: 'tentative' })], null, '2026-11-21', new Set())
    expect(alertLine(a)).toBe('Registration closes in 3 days — 24 November 2026 (expected date — not yet confirmed by the board)')
    expect(alertLine({ ...a, event: 'exam_date', daysLeft: 1, tentative: false })).toBe('Exam is tomorrow — 24 November 2026')
  })

  it('builds a digest with an unsubscribe link and escaped names', () => {
    const [a] = dueAlerts([sched()], null, '2026-11-21', new Set())
    const d = renderDigest({
      name: 'Asha Kumari', appUrl: 'https://x.in', unsubscribeUrl: 'https://x.in/alerts/unsubscribe?token=t',
      items: [{ ...a, examName: 'JEE <Main>', examUrl: 'https://x.in/exams/jee-main' }],
    })
    expect(d.subject).toBe('JEE <Main>: Registration closes in 3 days')
    expect(d.html).toContain('JEE &lt;Main&gt;')
    expect(d.html).toContain('alerts/unsubscribe?token=t')
    expect(d.text).toContain('Hi Asha,')
  })

  it('uses the Indian date', () => {
    expect(todayIST(new Date('2026-11-20T20:00:00Z'))).toBe('2026-11-21')
  })
})
