import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import {
  isBillingCycle,
  isPaidPlanId,
  mockPaymentsAllowed,
  periodEndFrom,
  razorpayConfigured,
  verifyHmacSignature,
} from '@/lib/payments'
import { rateLimit } from '@/lib/rate-limit'

// @ts-ignore - Razorpay types are not perfect
const Razorpay = require('razorpay')

export const runtime = 'nodejs'

let razorpay: any = null

// Initialize Razorpay only if keys are available
if (razorpayConfigured()) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body

    if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
      return NextResponse.json({ error: 'Invalid razorpayOrderId' }, { status: 400 })
    }

    if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string') {
      return NextResponse.json({ error: 'Invalid razorpayPaymentId' }, { status: 400 })
    }

    if (!razorpaySignature || typeof razorpaySignature !== 'string') {
      return NextResponse.json({ error: 'Invalid razorpaySignature' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const limit = rateLimit('payments', user.id, 10, 60_000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    // Subscriptions and payment records are written by the server only
    const admin = createAdminSupabaseClient()

    // The order must exist, belong to this user and still be pending
    const { data: order } = await admin
      .from('payment_history')
      .select('id, user_id, status, payment_method, metadata')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle()

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status === 'completed') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 409 })
    }

    let planId: unknown
    let billingCycle: unknown
    let paymentId = razorpayPaymentId
    let razorpaySubscriptionId: string | null = null
    let razorpayCustomerId: string | null = null

    if (order.payment_method === 'mock') {
      // Mock mode for testing without real Razorpay (never in production)
      if (!mockPaymentsAllowed()) {
        return NextResponse.json({ error: 'Mock payments are disabled' }, { status: 403 })
      }
      planId = order.metadata?.plan_id
      billingCycle = order.metadata?.billing_cycle
      paymentId = `pay_mock_${Date.now()}`
    } else {
      if (!razorpay) {
        return NextResponse.json({ error: 'Payments are not available right now.' }, { status: 503 })
      }

      // Verify payment signature
      const valid = verifyHmacSignature(
        `${razorpayOrderId}|${razorpayPaymentId}`,
        razorpaySignature,
        process.env.RAZORPAY_KEY_SECRET!
      )
      if (!valid) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
      }

      // @ts-ignore - Razorpay types have strict requirements
      const payment = await razorpay.payments.fetch(razorpayPaymentId as any)
      if (payment.status !== 'captured' || payment.order_id !== razorpayOrderId) {
        return NextResponse.json({ error: 'Payment not captured' }, { status: 400 })
      }

      // Plan details come from the order the server created, not the client
      // @ts-ignore - Razorpay types have strict requirements
      const rzOrder = await razorpay.orders.fetch(razorpayOrderId as any)
      if (rzOrder.notes?.userId !== user.id) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      planId = rzOrder.notes?.planId
      billingCycle = rzOrder.notes?.billingCycle
      razorpaySubscriptionId = payment.subscription_id ?? null
      razorpayCustomerId = payment.customer_id ?? null
    }

    if (!isPaidPlanId(planId) || !isBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Order has no valid plan' }, { status: 400 })
    }

    const startDate = new Date()
    const endDate = periodEndFrom(startDate, billingCycle)

    const { error: paymentError } = await admin
      .from('payment_history')
      .update({
        status: 'completed',
        razorpay_payment_id: paymentId,
        metadata: { ...(order.metadata ?? {}), verified: true, verified_at: startDate.toISOString() },
      })
      .eq('id', order.id)
    if (paymentError) console.error('Payment update error:', paymentError.message)

    const { error: subError } = await admin
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        razorpay_subscription_id: razorpaySubscriptionId,
        razorpay_customer_id: razorpayCustomerId,
        updated_at: startDate.toISOString(),
      }, { onConflict: 'user_id' })

    if (subError) {
      console.error('Subscription update error:', subError.message)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, planId, subscriptionEnd: endDate.toISOString() })
  } catch (error) {
    console.error('Payment verification error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
