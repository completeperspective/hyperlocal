import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Stripe singleton', () => {
  const originalKey = process.env.STRIPE_SECRET_KEY

  afterEach(() => {
    // Restore env and clear module cache so each test gets a fresh import
    process.env.STRIPE_SECRET_KEY = originalKey
    vi.resetModules()

    // Clear the globalThis singleton so subsequent imports re-initialise
    const g = globalThis as typeof globalThis & { __stripe?: unknown }
    delete g.__stripe
  })

  it('throws when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    // Clear cached singleton so the proxy getter re-evaluates the env var
    const g = globalThis as typeof globalThis & { __stripe?: unknown }
    delete g.__stripe

    const { stripe } = await import('../../lib/server/payments/stripe')
    // Error is deferred to first property access (lazy proxy pattern)
    expect(() => stripe.products).toThrow('STRIPE_SECRET_KEY')
  })

  it('initialises when key is present', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
    const { stripe } = await import('../../lib/server/payments/stripe')
    expect(stripe).toBeDefined()
  })
})
