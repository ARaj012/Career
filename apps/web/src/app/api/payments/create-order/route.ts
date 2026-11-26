import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { isBillingCycle, isPaidPlanId, mockPaymentsAllowed, razorpayConfigured } from '@/lib/payments'
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
    const { planId, billingCycle } = body

    if (!isPaidPlanId(planId)) {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }

    if (!isBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billingCycle (must be monthly or yearly)' }, { status: 400 })
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

    // payment_history is written by the server only
    const admin = createAdminSupabaseClient()

    // The price always comes from subscription_plans, the same table the Pricing page shows,
    // so a student is charged exactly what they saw (test mode included)
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const amount = Math.round(
      Number(billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly) * 100 // in paise
    )
    if (!(amount > 0)) {
      return NextResponse.json({ error: 'This plan has no price to pay' }, { status: 400 })
    }

    // Mock mode for testing without real Razorpay (never in production)
    if (mockPaymentsAllowed()) {
      const mockOrderId = `order_mock_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

      const { error: orderError } = await admin.from('payment_history').insert({
        user_id: user.id,
        razorpay_order_id: mockOrderId,
        amount: amount / 100, // Convert to rupees
        currency: plan.currency || 'INR',
        status: 'pending',
        payment_method: 'mock',
        metadata: { plan_id: planId, billing_cycle: billingCycle },
      })
      if (orderError) {
        console.error('Mock order creation error:', orderError.message)
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
      }

      return NextResponse.json({
        orderId: mockOrderId,
        amount,
        currency: plan.currency || 'INR',
        keyId: 'rzp_mock_test_key',
        notes: { planId, billingCycle },
      })
    }

    if (!razorpay) {
      return NextResponse.json({ error: 'Payments are not available right now.' }, { status: 503 })
    }

    const options = {
      amount,
      currency: plan.currency || 'INR',
      receipt: `sub_${Date.now()}`,
      notes: {
        userId: user.id,
        planId,
        billingCycle,
      },
    }

    // @ts-ignore - Razorpay types have strict requirements
    const order = await razorpay.orders.create(options as any)

    await admin.from('payment_history').insert({
      user_id: user.id,
      amount: amount / 100, // Convert back to rupees
      currency: plan.currency || 'INR',
      status: 'pending',
      payment_method: 'razorpay',
      razorpay_order_id: order.id,
      metadata: { plan_id: planId, billing_cycle: billingCycle },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Payment order creation error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
