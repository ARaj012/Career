import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { isBillingCycle, isPaidPlanId, periodEndFrom, verifyHmacSignature } from '@/lib/payments'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      // Nothing can be trusted without the secret, so nothing is processed
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Razorpay signs the raw body with HMAC-SHA256 using the webhook secret
    if (!verifyHmacSignature(body, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    // Only captured payments mean the money arrived
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity
      const notes = payment?.notes ?? {}
      const planId = notes.planId
      const billingCycle = notes.billingCycle
      const userId = notes.userId

      if (!payment?.order_id || typeof userId !== 'string' || !isPaidPlanId(planId) || !isBillingCycle(billingCycle)) {
        return NextResponse.json({ success: true, ignored: true })
      }

      const supabase = createAdminSupabaseClient()

      // The order must be one we created for this user
      const { data: order } = await supabase
        .from('payment_history')
        .select('id, user_id')
        .eq('razorpay_order_id', payment.order_id)
        .maybeSingle()
      if (!order || order.user_id !== userId) {
        return NextResponse.json({ success: true, ignored: true })
      }

      await supabase
        .from('payment_history')
        .update({
          status: 'completed',
          razorpay_payment_id: payment.id,
          invoice_url: payment.invoice_url,
        })
        .eq('id', order.id)

      const start = new Date()
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          billing_cycle: billingCycle,
          current_period_start: start.toISOString(),
          current_period_end: periodEndFrom(start, billingCycle).toISOString(),
          cancel_at_period_end: false,
          razorpay_subscription_id: payment.subscription_id ?? null,
          razorpay_customer_id: payment.customer_id ?? null,
          updated_at: start.toISOString(),
        }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
