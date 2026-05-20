import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import {
  activateMembership,
  createPendingMembership,
  updateMembershipCheckoutSession,
} from '@/server/payments/membership'
import { stripe } from '@/server/payments/stripe'

const query = () => keystoneContext.sudo().query

async function createStripeCheckout(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const body = await req.json()
  const { tierId, returnTo } = body
  if (!tierId) throw new ApiError(400, 'tierId is required')

  const tier = await query().MembershipTier.findOne({
    where: { id: tierId },
    query:
      'id name description priceInCents paymentType stripePriceId isActive',
  })

  if (!tier || !tier.isActive)
    throw new ApiError(404, 'Membership tier not found')

  // Free tier: activate immediately without Stripe
  if (tier.paymentType === 'free' || tier.priceInCents === 0) {
    const membershipId = await createPendingMembership(sessionData.id, tierId)
    await activateMembership(membershipId, 'free')
    return NextResponse.json({ activated: true })
  }

  const settings = await keystoneContext.sudo().query.Settings.findOne({
    where: { id: '1' },
    query: 'baseUrl',
  })
  const baseUrl =
    settings?.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:7777'

  const membershipId = await createPendingMembership(sessionData.id, tierId)

  const returnToParam =
    returnTo && typeof returnTo === 'string'
      ? `&returnTo=${encodeURIComponent(returnTo)}`
      : ''
  const successUrl = `${baseUrl}/dashboard/success?session_id={CHECKOUT_SESSION_ID}${returnToParam}`

  let checkoutSession
  const customerEmail = sessionData.email.endsWith('@wallet.local')
    ? undefined
    : sessionData.email
  const cancelUrl = `${baseUrl}/dashboard?checkout=cancelled`

  if (tier.paymentType === 'subscription' && tier.stripePriceId) {
    checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: tier.stripePriceId as string, quantity: 1 }],
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { membershipId, userId: sessionData.id, tierId },
      },
      { idempotencyKey: membershipId },
    )
  } else {
    checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        // Reason: customer_creation:'always' ensures session.customer is non-null
        // so the billing portal can look up the customer later without storing
        // stripeCustomerId on our side.
        customer_creation: 'always',
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency:
                ((tier as Record<string, unknown>).currency as string) || 'usd',
              unit_amount: tier.priceInCents as number,
              product_data: {
                name: tier.name as string,
                description: (tier.description as string) ?? undefined,
              },
            },
            quantity: 1,
          },
        ],
        // Reason: generates an invoice for one-time payments so it appears in
        // the Stripe billing portal invoice history.
        invoice_creation: { enabled: true },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { membershipId, userId: sessionData.id, tierId },
      },
      { idempotencyKey: membershipId },
    )
  }

  await updateMembershipCheckoutSession(membershipId, checkoutSession.id)

  return NextResponse.json({ url: checkoutSession.url })
}

export const POST = apiHandler(createStripeCheckout)
