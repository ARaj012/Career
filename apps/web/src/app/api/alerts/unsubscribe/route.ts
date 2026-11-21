import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const Body = z.object({ token: z.string().uuid(), resubscribe: z.boolean().optional() })

/**
 * One-click unsubscribe from the link in a reminder email (works without signing in).
 * POST only, so link scanners that open the page don't turn alerts off by themselves.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit('alerts-unsubscribe', getClientIp(req.headers), 10, 60_000)
  if (!limited.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'This link is not valid' }, { status: 400 })

  const db = createAdminSupabaseClient()
  const { data, error } = await db
    .from('user_alert_settings')
    .update({ email_alerts: !!parsed.data.resubscribe, updated_at: new Date().toISOString() })
    .eq('unsubscribe_token', parsed.data.token)
    .select('user_id')
  if (error) return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'This link is not valid' }, { status: 404 })
  return NextResponse.json({ emailAlerts: !!parsed.data.resubscribe })
}
