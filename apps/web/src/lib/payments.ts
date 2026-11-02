import crypto from 'crypto'

export const PAID_PLAN_IDS = ['basic', 'premium', 'pro', 'enterprise'] as const
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number]
export type BillingCycle = 'monthly' | 'yearly'

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === 'string' && (PAID_PLAN_IDS as readonly string[]).includes(value)
}

export function isBillingCycle(value: unknown): value is BillingCycle {
  return value === 'monthly' || value === 'yearly'
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

/**
 * Mock payments grant a paid plan without taking money, so they only run
 * outside production and only when Razorpay isn't configured.
 */
export function mockPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && !razorpayConfigured()
}

/** Constant-time compare of a hex HMAC-SHA256 of `payload` against `signature`. */
export function verifyHmacSignature(payload: string, signature: string | null | undefined, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function periodEndFrom(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start)
  if (cycle === 'yearly') end.setFullYear(end.getFullYear() + 1)
  else end.setMonth(end.getMonth() + 1)
  return end
}
