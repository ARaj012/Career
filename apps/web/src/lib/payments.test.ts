import crypto from 'crypto'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { isPaidPlanId, mockPaymentsAllowed, verifyHmacSignature } from './payments'

describe('verifyHmacSignature', () => {
  const secret = 'whsec_test'
  const body = '{"event":"payment.captured"}'
  const good = crypto.createHmac('sha256', secret).update(body).digest('hex')

  it('accepts the right signature', () => {
    expect(verifyHmacSignature(body, good, secret)).toBe(true)
  })

  it('rejects wrong, missing or tampered signatures', () => {
    expect(verifyHmacSignature(body, null, secret)).toBe(false)
    expect(verifyHmacSignature(body, good.slice(1), secret)).toBe(false)
    expect(verifyHmacSignature(body + ' ', good, secret)).toBe(false)
    expect(verifyHmacSignature(body, good, 'other')).toBe(false)
  })
})

describe('mockPaymentsAllowed', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is off in production even without Razorpay keys', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('RAZORPAY_KEY_ID', '')
    vi.stubEnv('RAZORPAY_KEY_SECRET', '')
    expect(mockPaymentsAllowed()).toBe(false)
  })

  it('is on in development without Razorpay keys', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('RAZORPAY_KEY_ID', '')
    vi.stubEnv('RAZORPAY_KEY_SECRET', '')
    expect(mockPaymentsAllowed()).toBe(true)
  })
})

describe('isPaidPlanId', () => {
  it('only accepts known paid plans', () => {
    expect(isPaidPlanId('premium')).toBe(true)
    expect(isPaidPlanId('free')).toBe(false)
    expect(isPaidPlanId('anything')).toBe(false)
  })
})
