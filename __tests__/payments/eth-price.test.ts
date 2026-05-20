import { beforeEach, describe, expect, it, vi } from 'vitest'

// Clear module cache and globalThis cache between tests
beforeEach(() => {
  const g = globalThis as typeof globalThis & { __ethPriceCache?: unknown }
  delete g.__ethPriceCache
  vi.resetModules()
})

describe('getEthUsdPrice', () => {
  it('fetches and returns ETH price from CoinGecko', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ethereum: { usd: 3000 } }),
    }) as typeof fetch

    const { getEthUsdPrice } =
      await import('../../lib/server/payments/eth-price')
    const price = await getEthUsdPrice()
    expect(price).toBe(3000)
  })

  it('returns cached value within TTL without re-fetching', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ethereum: { usd: 3000 } }),
    }) as typeof fetch
    global.fetch = mockFetch

    const { getEthUsdPrice } =
      await import('../../lib/server/payments/eth-price')
    await getEthUsdPrice()
    await getEthUsdPrice()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws when CoinGecko returns non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }) as typeof fetch

    const { getEthUsdPrice } =
      await import('../../lib/server/payments/eth-price')
    await expect(getEthUsdPrice()).rejects.toThrow('429')
  })

  it('throws when response has invalid shape', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ethereum: { usd: null } }),
    }) as typeof fetch

    const { getEthUsdPrice } =
      await import('../../lib/server/payments/eth-price')
    await expect(getEthUsdPrice()).rejects.toThrow('Invalid')
  })
})
