/**
 * Logical sanity checks. A value can be quoted correctly and still be wrong
 * for the row (e.g. last year's date on an archive page). These rules catch
 * the impossible combinations that were in the old data.
 */

export type ScheduleDates = {
  registration_start?: string | null
  registration_end?: string | null
  exam_date_start?: string | null
  exam_date_end?: string | null
  result_date?: string | null
}

const DAY = 86_400_000
const t = (d?: string | null) => (d ? new Date(`${d}T00:00:00Z`).getTime() : null)

export function validateSchedule(year: number, s: ScheduleDates, today = new Date()): string[] {
  const issues: string[] = []
  const now = today.getTime()

  for (const [k, v] of Object.entries(s)) {
    if (!v) continue
    const ms = t(v)
    if (ms === null || Number.isNaN(ms)) issues.push(`${k} is not a valid date`)
    else if (ms < now - 3 * 365 * DAY || ms > now + 3 * 365 * DAY) issues.push(`${k} ${v} is outside a plausible window`)
  }
  if (issues.length) return issues

  const rs = t(s.registration_start), re = t(s.registration_end)
  const es = t(s.exam_date_start), ee = t(s.exam_date_end), rd = t(s.result_date)

  if (rs && re && rs > re) issues.push('registration starts after it ends')
  if (re && es && re > es) issues.push('registration ends after the exam starts')
  if (rs && es && rs > es) issues.push('registration starts after the exam')
  if (es && ee && es > ee) issues.push('exam ends before it starts')
  if (rd && (ee ?? es) && rd < (ee ?? es)!) issues.push('result is before the exam')
  if (rd && es && rd - es > 400 * DAY) issues.push('result more than 13 months after exam')

  // The cycle "year" is the year the exam is written in.
  if (s.exam_date_start) {
    const examYear = Number(s.exam_date_start.slice(0, 4))
    if (examYear !== year) issues.push(`exam date year ${examYear} does not match cycle year ${year}`)
  } else if (s.registration_start) {
    const regYear = Number(s.registration_start.slice(0, 4))
    if (regYear !== year && regYear !== year - 1) issues.push(`registration year ${regYear} does not fit cycle ${year}`)
  }
  return issues
}

export function validateScholarship(f: {
  application_deadline?: string | null
  amount_min?: number | null
  amount_max?: number | null
}, today = new Date()): string[] {
  const issues: string[] = []
  if (f.application_deadline) {
    const ms = t(f.application_deadline)
    if (ms === null || Number.isNaN(ms)) issues.push('deadline is not a valid date')
    else if (ms < today.getTime() - 400 * DAY) issues.push('deadline is more than a year in the past (likely an old cycle)')
    else if (ms > today.getTime() + 2 * 365 * DAY) issues.push('deadline is implausibly far ahead')
  }
  for (const k of ['amount_min', 'amount_max'] as const) {
    const v = f[k]
    if (v != null && (v <= 0 || v > 50_00_00_000)) issues.push(`${k} ${v} is implausible`)
  }
  if (f.amount_min != null && f.amount_max != null && f.amount_min > f.amount_max) issues.push('amount_min > amount_max')
  return issues
}
