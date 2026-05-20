import { createHmac } from 'node:crypto'
import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { parseEther } from 'viem'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import { getEthUsdPrice } from '@/server/payments/eth-price'

export const QUOTE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function signQuote(payload: object): string {
  const secret = process.env.CRYPTO_QUOTE_HMAC_SECRET
  if (!secret) throw new Error('CRYPTO_QUOTE_HMAC_SECRET is not set')
  return createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
}

async function getQuote(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tierId = searchParams.get('tierId')
  if (!tierId) throw new ApiError(400, 'tierId is required')

  const tier = await keystoneContext.sudo().query.MembershipTier.findOne({
    where: { id: tierId },
    query: 'id priceInCents paymentType isActive',
  })

  if (!tier || !tier.isActive)
    throw new ApiError(404, 'Membership tier not found')
  if (tier.paymentType === 'subscription') {
    throw new ApiError(400, 'Subscriptions must be paid via Stripe')
  }

  let priceUsd: number
  try {
    priceUsd = await getEthUsdPrice()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Price fetch failed'
    throw new ApiError(503, `Unable to fetch ETH price: ${message}`)
  }

  const usdAmount = tier.priceInCents / 100
  // Reason: toFixed(18) avoids scientific notation which parseEther cannot handle.
  const ethAmount = (usdAmount / priceUsd).toFixed(18)
  const ethAmountWei = parseEther(ethAmount as `${number}`).toString()

  const expiry = Date.now() + QUOTE_TTL_MS
  const quote = { tierId, ethAmountWei, expiry }
  const sig = signQuote(quote)

  return NextResponse.json({ quote, sig, ethPriceUsd: priceUsd })
}

export const GET = apiHandler(getQuote)
