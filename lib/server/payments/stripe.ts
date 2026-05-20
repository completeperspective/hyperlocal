import Stripe from 'stripe'

// Reason: lazy getter instead of module-level throw so `next build` can statically
// analyze routes without STRIPE_SECRET_KEY present in the build environment.
// The error is deferred until an actual request hits a Stripe-dependent handler.
const g = globalThis as typeof globalThis & { __stripe?: Stripe }

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!g.__stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required')
      }
      g.__stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-04-22.dahlia',
        typescript: true,
      })
    }
    return (g.__stripe as unknown as Record<string | symbol, unknown>)[prop]
  },
})
