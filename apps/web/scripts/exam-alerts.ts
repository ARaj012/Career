/**
 * Daily exam reminders: for every student, the dates of the exams they track
 * that are coming up (registration opening/closing, exam day, result), sent as
 * one email a day plus in-app notifications. Each reminder is sent once.
 *
 *   npx tsx scripts/exam-alerts.ts             # send today's reminders
 *   npx tsx scripts/exam-alerts.ts --dry-run   # show what would be sent
 *   npx tsx scripts/exam-alerts.ts --today=2026-12-01 --dry-run
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL
 * Email (optional — mock mode without them): BREVO_API_KEY, ALERTS_FROM_EMAIL, ALERTS_FROM_NAME
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import {
  alertKey, alertLine, dueAlerts, emailConfigured, renderDigest, sendEmail, todayIST,
  type DigestItem, type PrefIn, type ScheduleIn,
} from '../src/lib/exam-alerts'

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (!hit) return undefined
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : 'true'
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    process.exit(1)
  }
  const db = createClient(url, key, { auth: { persistSession: false } })
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const dryRun = arg('dry-run') === 'true'
  const today = arg('today') ?? todayIST()
  console.log(`🔔 Exam alerts for ${today}${dryRun ? ' (dry run)' : ''} — email ${emailConfigured() ? 'via Brevo' : 'in MOCK mode (set BREVO_API_KEY and ALERTS_FROM_EMAIL to send)'}`)

  // Who tracks what: saved exams, plus exams with tracking settings
  const [{ data: saved }, { data: prefs }] = await Promise.all([
    db.from('user_saved_exams').select('user_id, exam_id'),
    db.from('user_exam_tracking_preferences').select('user_id, exam_id, notify_registration_start, notify_registration_end, notify_exam_date, notify_result, countdown_reminders, countdown_days, is_tracking_enabled'),
  ])
  const prefOf = new Map<string, PrefIn>((prefs ?? []).map((p) => [`${p.user_id}|${p.exam_id}`, p as PrefIn]))
  const tracked = new Map<string, Set<string>>() // user → exams
  for (const r of [...(saved ?? []), ...(prefs ?? [])]) {
    if (!tracked.has(r.user_id)) tracked.set(r.user_id, new Set())
    tracked.get(r.user_id)!.add(r.exam_id)
  }
  const examIds = [...new Set([...tracked.values()].flatMap((s) => [...s]))]
  const userIds = [...tracked.keys()]
  if (!examIds.length) {
    console.log('Summary: nobody tracks an exam yet — nothing to send')
    return
  }

  const [{ data: schedules }, { data: exams }, { data: log }, { data: settings }, { data: accounts }] = await Promise.all([
    db.from('exam_schedules').select('exam_id, year, session, registration_start, registration_end, exam_date_start, result_date, data_status').in('exam_id', examIds),
    db.from('exams').select('id, name, slug').in('id', examIds),
    db.from('exam_alert_log').select('user_id, exam_id, event, event_date, threshold').in('user_id', userIds).gte('event_date', today),
    db.from('user_alert_settings').select('user_id, email_alerts, unsubscribe_token').in('user_id', userIds),
    db.from('user_accounts').select('user_id, email, full_name, is_active').in('user_id', userIds),
  ])
  const byExam = new Map<string, ScheduleIn[]>()
  for (const s of (schedules ?? []) as ScheduleIn[]) {
    if (!byExam.has(s.exam_id)) byExam.set(s.exam_id, [])
    byExam.get(s.exam_id)!.push(s)
  }
  const examOf = new Map((exams ?? []).map((e) => [e.id as string, e]))
  const sentFor = new Map<string, Set<string>>()
  for (const l of log ?? []) {
    if (!sentFor.has(l.user_id)) sentFor.set(l.user_id, new Set())
    sentFor.get(l.user_id)!.add(alertKey({ examId: l.exam_id, event: l.event, date: l.event_date, threshold: l.threshold }))
  }
  const settingOf = new Map((settings ?? []).map((s) => [s.user_id as string, s]))
  const accountOf = new Map((accounts ?? []).map((a) => [a.user_id as string, a]))

  let users = 0, emails = 0, mocked = 0, failed = 0, notices = 0
  for (const userId of userIds) {
    const account = accountOf.get(userId)
    if (account && account.is_active === false) continue
    const items: DigestItem[] = []
    for (const examId of tracked.get(userId)!) {
      const exam = examOf.get(examId)
      if (!exam) continue
      for (const a of dueAlerts(byExam.get(examId) ?? [], prefOf.get(`${userId}|${examId}`) ?? null, today, sentFor.get(userId) ?? new Set())) {
        items.push({ ...a, examName: exam.name, examUrl: `${appUrl}/exams/${exam.slug}` })
      }
    }
    if (!items.length) continue
    users++

    // Make sure the student has an unsubscribe token (email alerts are on unless they turned them off)
    let setting = settingOf.get(userId)
    if (!setting && !dryRun) {
      const { data } = await db.from('user_alert_settings').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: false }).select('user_id, email_alerts, unsubscribe_token').single()
      setting = data ?? undefined
    }
    const wantsEmail = setting?.email_alerts !== false && !!account?.email
    const unsubscribeUrl = `${appUrl}/alerts/unsubscribe?token=${setting?.unsubscribe_token ?? ''}`
    const digest = renderDigest({ name: account?.full_name, items, appUrl, unsubscribeUrl })

    console.log(`  👤 ${userId.slice(0, 8)}… ${items.length} reminder(s)${wantsEmail ? '' : ' (email off)'}`)
    for (const i of items) console.log(`     • ${i.examName}: ${alertLine(i)}`)
    if (dryRun) continue

    let status: 'sent' | 'mock' | 'failed' | 'off' = 'off'
    if (wantsEmail) {
      const r = await sendEmail({ to: account!.email!, subject: digest.subject, html: digest.html, text: digest.text, unsubscribeUrl })
      status = r.status
      if (r.status === 'sent') emails++
      else if (r.status === 'mock') mocked++
      else { failed++; console.log(`     ❌ ${r.error}`) }
      if (r.status === 'sent') await db.from('user_alert_settings').update({ last_email_at: new Date().toISOString() }).eq('user_id', userId)
    }
    // A failed email is not logged, so tomorrow's run tries again
    if (status === 'failed') continue

    await db.from('exam_alert_log').upsert(
      items.map((i) => ({ user_id: userId, exam_id: i.examId, event: i.event, event_date: i.date, threshold: i.threshold, email_status: status })),
      { onConflict: 'user_id,exam_id,event,event_date,threshold', ignoreDuplicates: true },
    )
    const { error } = await db.from('user_notifications').insert(items.map((i) => ({
      user_id: userId,
      type: 'exam_reminder',
      title: `${i.examName}: ${alertLine(i).replace(/ — .*$/, '').replace(/ \(expected.*$/, '')}`,
      message: alertLine(i),
      link: `/exams/${examOf.get(i.examId)!.slug}`,
      metadata: { exam_id: i.examId, event: i.event, event_date: i.date, tentative: i.tentative },
    })))
    if (error) console.log(`     ⚠️ in-app notification: ${error.message}`)
    else notices += items.length
  }

  console.log(`Summary: ${users} students with reminders; ${emails} emails sent, ${mocked} mock, ${failed} failed; ${notices} in-app notifications`)
  if (failed) process.exitCode = 1
}

main().catch((err) => {
  console.error('❌ Exam alerts crashed:', err)
  process.exit(1)
})
