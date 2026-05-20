import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { createOrActivateMembershipByStripeSession } from '@/server/payments/membership'
import { stripe } from '@/server/payments/stripe'

// Reason: called from the success page immediately after Stripe redirect —
// activates the membership directly via Stripe API rather than waiting for
// the webhook. Works in dev without Stripe CLI and handles webhook delays.
// Uses createOrActivateMembershipByStripeSession so it works even if the
// pending record was never persisted (e.g. a crash between create and redirect).
async function verifyStripeCheckout(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) throw new ApiError(400, 'session_id is required')

  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

  if (stripeSession.payment_status !== 'paid') {
    return NextResponse.json({
      activated: false,
      status: stripeSession.payment_status,
    })
  }

  const { userId, tierId } = stripeSession.metadata ?? {}
  if (!userId || !tierId)
    throw new ApiError(400, 'Session is missing userId or tierId metadata')

  const subscriptionId = stripeSession.subscription
    ? (stripeSession.subscription as string)
    : undefined

  await createOrActivateMembershipByStripeSession(
    sessionId,
    userId,
    tierId,
    subscriptionId,
  )

  return NextResponse.json({ activated: true })
}

export const GET = apiHandler(verifyStripeCheckout)
