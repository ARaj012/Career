import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/** The signed-in student's email-reminder switch (on unless they turned it off). */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const [{ data: setting }, { data: log }] = await Promise.all([
    supabase.from('user_alert_settings').select('email_alerts, last_email_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('exam_alert_log').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ])
  return NextResponse.json({
    emailAlerts: setting?.email_alerts ?? true,
    email: user.email ?? null,
    lastEmailAt: setting?.last_email_at ?? null,
    lastReminderAt: log?.[0]?.created_at ?? null,
  })
}

const Body = z.object({ emailAlerts: z.boolean() })

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { error } = await supabase
    .from('user_alert_settings')
    .upsert({ user_id: user.id, email_alerts: parsed.data.emailAlerts, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: 'Could not save your setting' }, { status: 500 })
  return NextResponse.json({ emailAlerts: parsed.data.emailAlerts })
}
