import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

/**
 * Every student's subscription, with their name/email, the plans and their payments.
 * Runs with the service role because students can only read their own rows; access is
 * limited to admins (ADMIN_EMAILS).
 */
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = createAdminSupabaseClient()
    const { data: subs, error } = await db
      .from('user_subscriptions')
      .select('id, user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const userIds = [...new Set((subs ?? []).map((s) => s.user_id).filter(Boolean))]
    const [{ data: accounts }, { data: plans }, { data: payments }] = await Promise.all([
      userIds.length
        ? db.from('user_accounts').select('user_id, email, full_name').in('user_id', userIds)
        : Promise.resolve({ data: [] as { user_id: string; email: string | null; full_name: string | null }[] }),
      db.from('subscription_plans').select('id, name, price_monthly, price_yearly').eq('is_active', true).order('display_order'),
      userIds.length
        ? db.from('payment_history')
            .select('id, user_id, subscription_id, amount, currency, status, payment_method, razorpay_payment_id, metadata, created_at')
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    const byUser = new Map((accounts ?? []).map((a) => [a.user_id, a]))
    const subscriptions = (subs ?? []).map((s) => ({
      ...s,
      user_email: byUser.get(s.user_id)?.email ?? '',
      user_name: byUser.get(s.user_id)?.full_name ?? '',
    }))

    return NextResponse.json({ subscriptions, plans: plans ?? [], payments: payments ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load subscriptions' }, { status: 500 })
  }
}
