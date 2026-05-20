import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import { stripe } from '@/server/payments/stripe'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session?.data) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.data.id

  const memberships = await keystoneContext.sudo().db.UserMembership.findMany({
    where: {
      user: { id: { equals: userId } },
      status: { in: ['active', 'pending'] },
      paymentMethod: { equals: 'stripe' },
    },
    orderBy: [{ activatedAt: 'desc' }],
  })

  const membership =
    (memberships[0] as unknown as {
      stripeSubscriptionId: string | null
      stripeCheckoutSessionId: string | null
    }) ?? null

  if (!membership) {
    return NextResponse.json(
      { message: 'No active Stripe membership found' },
      { status: 404 },
    )
  }

  // Reason: we intentionally do not store stripeCustomerId — look it up
  // dynamically from the subscription or checkout session so no extra field
  // is needed on the User schema.
  let customerId: string | null = null

  if (membership.stripeSubscriptionId) {
    const sub = await stripe.subscriptions.retrieve(
      membership.stripeSubscriptionId,
    )
    customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  } else if (membership.stripeCheckoutSessionId) {
    const checkout = await stripe.checkout.sessions.retrieve(
      membership.stripeCheckoutSessionId,
      { expand: ['payment_intent'] },
    )
    if (checkout.customer) {
      customerId =
        typeof checkout.customer === 'string'
          ? checkout.customer
          : checkout.customer.id
    } else if (
      checkout.payment_intent &&
      typeof checkout.payment_intent === 'object'
    ) {
      // Reason: fallback for sessions created before customer_creation:'always' was set —
      // some payment intents have a customer even when the session does not.
      const pi = checkout.payment_intent
      customerId = pi.customer
        ? typeof pi.customer === 'string'
          ? pi.customer
          : pi.customer.id
        : null
    }
  }

  if (!customerId) {
    return NextResponse.json(
      { message: 'Could not resolve Stripe customer for this membership' },
      { status: 422 },
    )
  }

  const returnUrl = `${new URL(req.url).origin}/dashboard?portal=returned`

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return NextResponse.json({ url: portalSession.url })
}
