// Reason: module-level cache survives across requests within a single server process
// but is wiped on cold start, which is acceptable — a fresh CoinGecko call on boot is fine.
const CACHE_TTL_MS = 60_000

interface PriceCache {
  priceUsd: number
  fetchedAt: number
}

const g = globalThis as typeof globalThis & { __ethPriceCache?: PriceCache }

export async function getEthUsdPrice(): Promise<number> {
  const now = Date.now()
  if (g.__ethPriceCache && now - g.__ethPriceCache.fetchedAt < CACHE_TTL_MS) {
    return g.__ethPriceCache.priceUsd
  }

  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    { next: { revalidate: 0 } },
  )

  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status}`)
  }

  const data = (await res.json()) as { ethereum: { usd: number } }
  const priceUsd = data.ethereum.usd

  if (!priceUsd || typeof priceUsd !== 'number') {
    throw new Error('Invalid CoinGecko response')
  }

  g.__ethPriceCache = { priceUsd, fetchedAt: now }
  return priceUsd
}
