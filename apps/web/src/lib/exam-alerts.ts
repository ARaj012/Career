/**
 * Exam reminders by email: which dates a student should hear about today, the
 * digest email that tells them, and the sender.
 *
 * Email goes through Brevo's free plan (300 emails a day, no domain needed —
 * just a verified sender address). Without BREVO_API_KEY and ALERTS_FROM_EMAIL
 * it runs in mock mode: in-app notifications are still created and the email
 * is only logged, the same way payments fall back to mock mode.
 */

export type AlertEvent = 'registration_start' | 'registration_end' | 'exam_date' | 'result'

export interface ScheduleIn {
  exam_id: string
  year: number | null
  session: string | null
  registration_start: string | null
  registration_end: string | null
  exam_date_start: string | null
  result_date: string | null
  data_status: string | null
}

export interface PrefIn {
  notify_registration_start: boolean | null
  notify_registration_end: boolean | null
  notify_exam_date: boolean | null
  notify_result: boolean | null
  countdown_reminders: boolean | null
  countdown_days: number[] | null
  is_tracking_enabled: boolean | null
}

export interface DueAlert {
  examId: string
  event: AlertEvent
  date: string
  daysLeft: number
  threshold: number
  tentative: boolean
  session: string | null
}

/** Same defaults as user_exam_tracking_preferences, for students who never opened the settings */
export const DEFAULT_COUNTDOWN = [60, 30, 15, 7, 3, 1, 0]

const EVENTS: { event: AlertEvent; field: keyof ScheduleIn; pref: keyof PrefIn }[] = [
  { event: 'registration_start', field: 'registration_start', pref: 'notify_registration_start' },
  { event: 'registration_end', field: 'registration_end', pref: 'notify_registration_end' },
  { event: 'exam_date', field: 'exam_date_start', pref: 'notify_exam_date' },
  { event: 'result', field: 'result_date', pref: 'notify_result' },
]

export const alertKey = (a: { examId: string; event: string; date: string; threshold: number }) =>
  `${a.examId}|${a.event}|${a.date}|${a.threshold}`

const dayDiff = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

/** Today's date in India (the job runs at 07:00 IST) as YYYY-MM-DD */
export const todayIST = (now = new Date()) => new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)

/**
 * Reminders due today for one tracked exam. A reminder fires when a date comes
 * within one of the student's countdown steps (60, 30, 15, 7, 3, 1 days, the day
 * itself). If the job missed a day, the step is still sent late, once.
 */
export function dueAlerts(schedules: ScheduleIn[], pref: PrefIn | null, today: string, sent: Set<string>): DueAlert[] {
  if (pref?.is_tracking_enabled === false) return []
  const steps = pref?.countdown_reminders === false
    ? [0]
    : [...new Set([...(pref?.countdown_days?.length ? pref.countdown_days : DEFAULT_COUNTDOWN), 0])].sort((a, b) => a - b)
  const out: DueAlert[] = []
  for (const s of schedules) {
    for (const { event, field, pref: flag } of EVENTS) {
      const date = s[field] as string | null
      if (!date || pref?.[flag] === false) continue
      const daysLeft = dayDiff(today, date)
      if (daysLeft < 0) continue
      const threshold = steps.find((t) => t >= daysLeft)
      if (threshold === undefined) continue
      const a = { examId: s.exam_id, event, date, daysLeft, threshold, tentative: s.data_status !== 'verified', session: s.session }
      if (sent.has(alertKey(a))) continue
      out.push(a)
    }
  }
  return out
}

const LONG_DATE = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function when(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

/** "Registration closes in 3 days (24 November 2026)" */
export function alertLine(a: DueAlert): string {
  const verb = {
    registration_start: 'Registration opens',
    registration_end: 'Registration closes',
    exam_date: 'Exam',
    result: 'Result expected',
  }[a.event]
  const session = a.session && !/^default$/i.test(a.session) ? ` (${a.session})` : ''
  const tail = a.daysLeft === 0 ? '' : ` — ${LONG_DATE(a.date)}`
  const exam = a.event === 'exam_date' ? `${verb}${session} is ${when(a.daysLeft)}` : `${verb}${session} ${when(a.daysLeft)}`
  return `${exam}${tail}${a.tentative ? ' (expected date — not yet confirmed by the board)' : ''}`
}

/** Most urgent first: closing registrations, then by date */
export function sortAlerts<T extends DueAlert>(alerts: T[]): T[] {
  const weight: Record<AlertEvent, number> = { registration_end: 0, exam_date: 1, registration_start: 2, result: 3 }
  return [...alerts].sort((a, b) => a.daysLeft - b.daysLeft || weight[a.event] - weight[b.event])
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export interface DigestItem extends DueAlert { examName: string; examUrl: string }

export function renderDigest(opts: { name?: string | null; items: DigestItem[]; appUrl: string; unsubscribeUrl: string }) {
  const items = sortAlerts(opts.items)
  const first = items[0]
  const subject = items.length === 1
    ? `${first.examName}: ${alertLine(first).replace(/ — .*$/, '').replace(/ \(expected.*$/, '')}`
    : `${items.length} exam dates coming up — ${first.examName} ${alertLine(first).replace(/ — .*$/, '').replace(/ \(expected.*$/, '').toLowerCase()}`
  const hello = opts.name ? `Hi ${opts.name.split(' ')[0]},` : 'Hi,'
  const text = [
    hello, '', 'Here are the dates coming up for the exams you track:', '',
    ...items.map((i) => `• ${i.examName}: ${alertLine(i)}\n  ${i.examUrl}`), '',
    `Manage your exams: ${opts.appUrl}/my-exams`,
    `Stop these emails: ${opts.unsubscribeUrl}`,
  ].join('\n')
  const rows = items.map((i) => `
      <tr><td style="padding:12px 0;border-bottom:1px solid #eef0f3">
        <a href="${esc(i.examUrl)}" style="color:#111827;font-weight:600;text-decoration:none">${esc(i.examName)}</a>
        <div style="color:#374151;margin-top:2px">${esc(alertLine(i))}</div>
      </td></tr>`).join('')
  const html = `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
      <tr><td style="padding:24px 24px 8px">
        <div style="font-size:18px;font-weight:700;color:#4f46e5">CareerGuide</div>
        <p style="color:#111827;margin:16px 0 4px">${esc(hello)}</p>
        <p style="color:#374151;margin:0">Here are the dates coming up for the exams you track:</p>
      </td></tr>
      <tr><td style="padding:0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
      <tr><td style="padding:20px 24px">
        <a href="${esc(opts.appUrl)}/my-exams" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open my exams</a>
        <p style="color:#6b7280;font-size:12px;margin:20px 0 0">Always confirm dates on the exam board's official website.
        You get these because you track these exams on CareerGuide. <a href="${esc(opts.unsubscribeUrl)}" style="color:#6b7280">Stop these emails</a></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`
  return { subject, text, html }
}

export type SendStatus = 'sent' | 'mock' | 'failed'

export function emailConfigured(): boolean {
  return !!process.env.BREVO_API_KEY && !!process.env.ALERTS_FROM_EMAIL
}

/** Send one email through Brevo, or log it in mock mode. Never throws. */
export async function sendEmail(msg: { to: string; subject: string; html: string; text: string; unsubscribeUrl: string }): Promise<{ status: SendStatus; error?: string }> {
  if (!emailConfigured()) return { status: 'mock' }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: process.env.ALERTS_FROM_EMAIL, name: process.env.ALERTS_FROM_NAME || 'CareerGuide' },
        to: [{ email: msg.to }],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
        headers: { 'List-Unsubscribe': `<${msg.unsubscribeUrl}>` },
      }),
    })
    if (!res.ok) return { status: 'failed', error: `Brevo ${res.status}: ${(await res.text()).slice(0, 200)}` }
    return { status: 'sent' }
  } catch (err) {
    return { status: 'failed', error: (err as Error).message }
  }
}
