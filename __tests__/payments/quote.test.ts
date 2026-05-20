import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import {
  QUOTE_TTL_MS,
  signQuote,
} from '../../app/api/v1/memberships/checkout/crypto/quote/route'

process.env.CRYPTO_QUOTE_HMAC_SECRET = 'test-secret-at-least-32-chars-long!!'

// Reason: mock keystoneContext to prevent Prisma/Keystone from initialising
// in the test environment — the quote test only exercises the pure signQuote helper.
vi.mock('~/keystone', () => ({ default: {} }))
vi.mock('@/server/keystone/context', () => ({
  keystoneContext: { sudo: () => ({ query: {} }) },
}))
vi.mock('@/server/payments/eth-price', () => ({
  getEthUsdPrice: vi.fn().mockResolvedValue(3000),
}))
vi.mock('@/server/api', () => ({
  apiHandler: (fn: unknown) => fn,
}))

describe('signQuote', () => {
  it('produces consistent HMAC for the same payload', () => {
    const payload = { tierId: 'abc', ethAmountWei: '1000000', expiry: 9999 }
    expect(signQuote(payload)).toBe(signQuote(payload))
  })

  it('produces different HMAC for different payloads', () => {
    const a = { tierId: 'abc', ethAmountWei: '1000000', expiry: 9999 }
    const b = { tierId: 'xyz', ethAmountWei: '1000000', expiry: 9999 }
    expect(signQuote(a)).not.toBe(signQuote(b))
  })

  it('QUOTE_TTL_MS is 5 minutes', () => {
    expect(QUOTE_TTL_MS).toBe(5 * 60 * 1000)
  })

  it('matches a manually computed HMAC-SHA256', () => {
    const payload = {
      tierId: 'tier1',
      ethAmountWei: '500000000000000',
      expiry: 1234567890,
    }
    const expected = createHmac(
      'sha256',
      'test-secret-at-least-32-chars-long!!',
    )
      .update(JSON.stringify(payload))
      .digest('hex')
    expect(signQuote(payload)).toBe(expected)
  })
})
