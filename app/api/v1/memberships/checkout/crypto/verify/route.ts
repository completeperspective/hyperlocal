import { timingSafeEqual } from 'node:crypto'
import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import { verifyOnChainPayment } from '@/server/payments/crypto-verify'
import {
  activateMembership,
  createPendingMembership,
  getMembershipByTxHash,
} from '@/server/payments/membership'
import { signQuote } from '../quote/route'

// Reason: 5% tolerance expressed as basis points to avoid floating-point division.
// Using BigInt() constructor instead of literal `n` suffix for ES2017 TS target compat.
const TOLERANCE_BPS = BigInt(500)
const BASIS_POINTS_DENOMINATOR = BigInt(10000)

const query = () => keystoneContext.sudo().query

interface CryptoQuote {
  tierId: string
  ethAmountWei: string
  expiry: number
}

// Reason: constant-time comparison helper prevents timing attacks on HMAC signatures.
function verifyHmacSignature(expected: string, received: string): boolean {
  // Both must be valid hex strings of equal length; Buffer.from will return
  // an empty buffer for invalid hex, making lengths differ which we catch below.
  const expectedBuf = Buffer.from(expected, 'hex')
  const receivedBuf = Buffer.from(received, 'hex')
  if (expectedBuf.length === 0 || expectedBuf.length !== receivedBuf.length) {
    return false
  }
  return timingSafeEqual(expectedBuf, receivedBuf)
}

async function verifyCryptoPayment(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const body = await req.json()
  const { tierId, txHash, quote, sig } = body as {
    tierId: string
    txHash: string
    quote: CryptoQuote
    sig: string
  }

  if (!tierId || !txHash || !quote || !sig) {
    throw new ApiError(400, 'tierId, txHash, quote, and sig are required')
  }
  if (typeof txHash !== 'string' || !txHash.startsWith('0x')) {
    throw new ApiError(400, 'Invalid txHash format')
  }

  // Validate HMAC — proves the server issued this quote and it was not tampered with.
  const expectedSig = signQuote(quote)
  if (!verifyHmacSignature(expectedSig, sig)) {
    throw new ApiError(401, 'Invalid quote signature')
  }

  // Validate quote fields match the request
  if (quote.tierId !== tierId) {
    throw new ApiError(400, 'Quote tierId does not match request')
  }

  // Validate expiry
  if (Date.now() > quote.expiry) {
    throw new ApiError(400, 'Quote expired — please request a new quote')
  }

  // Replay protection
  const existing = await getMembershipByTxHash(txHash)
  if (existing)
    throw new ApiError(400, 'Transaction already used for a membership')

  const tier = await query().MembershipTier.findOne({
    where: { id: tierId },
    query: 'id name priceInCents paymentType isActive',
  })
  if (!tier || !tier.isActive)
    throw new ApiError(404, 'Membership tier not found')
  if (tier.paymentType === 'subscription') {
    throw new ApiError(400, 'Subscriptions must be paid via Stripe')
  }

  const settings = await keystoneContext.sudo().query.Settings.findOne({
    where: { id: '1' },
    query: 'receiverWalletAddress',
  })
  if (!settings?.receiverWalletAddress) {
    throw new ApiError(503, 'Crypto payments are not configured')
  }

  // Reason: never recalculate ETH from a live rate at verify time — always use
  // the signed quote amount to prevent manipulation by price movement.
  const quotedWei = BigInt(quote.ethAmountWei as string)
  // Apply 5% tolerance: accept tx.value >= quotedWei * 0.95
  const expectedWei =
    quotedWei - (quotedWei * TOLERANCE_BPS) / BASIS_POINTS_DENOMINATOR

  const result = await verifyOnChainPayment(
    txHash as `0x${string}`,
    settings.receiverWalletAddress,
    expectedWei,
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 402 })
  }

  const membershipId = await createPendingMembership(sessionData.id, tierId)

  await query().UserMembership.updateOne({
    where: { id: membershipId },
    data: { cryptoTxHash: txHash },
  })

  await activateMembership(membershipId, 'crypto')

  return NextResponse.json({ activated: true })
}

export const POST = apiHandler(verifyCryptoPayment)
