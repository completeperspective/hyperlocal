// IMPORTANT: This route must NOT use apiHandler — Stripe signature verification
// requires the raw request body. Using apiHandler would wrap the handler and
// may consume the body stream before constructEvent can read it.

import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { keystoneContext } from '@/server/keystone/context'
import {
  createOrActivateMembershipByStripeSession,
  expireMembership,
  failMembership,
} from '@/server/payments/membership'
import { stripe } from '@/server/payments/stripe'

// Reason: all DB access uses prisma directly — Keystone query/db layers have
// intermittent access-control failures on relationship resolution even under sudo().
const prisma = () => keystoneContext.prisma

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 },
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, tierId } = session.metadata ?? {}
        if (!userId || !tierId) break

        const subscriptionId = session.subscription
          ? (session.subscription as string)
          : undefined

        // Reason: createOrActivateMembershipByStripeSession is idempotent and
        // creates the record if the pending row was never persisted (e.g. crash
        // between createPendingMembership and the Stripe redirect).
        await createOrActivateMembershipByStripeSession(
          session.id,
          userId,
          tierId,
          subscriptionId,
        )
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Reason: Stripe.Invoice type may vary across API versions; cast to access subscription.
        const subscriptionId = (invoice as unknown as { subscription?: string })
          .subscription
        if (!subscriptionId) break

        const membership = await prisma().userMembership.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true, status: true },
        })
        if (!membership) break

        // Reason: renewal period end comes from the first line item's period end timestamp.
        const periodEnd = (
          invoice as unknown as {
            lines?: { data?: Array<{ period?: { end?: number } }> }
          }
        ).lines?.data?.[0]?.period?.end
        const expiresAt = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : undefined

        await prisma().userMembership.update({
          where: { id: membership.id },
          data: {
            status: 'active',
            ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription?: string })
          .subscription
        if (!subscriptionId) break

        const membership = await prisma().userMembership.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true },
        })
        if (membership) await failMembership(membership.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const membership = await prisma().userMembership.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          select: { id: true },
        })
        if (membership) await expireMembership(membership.id)
        break
      }

      // Reason: safety net for users who abandon checkout without returning to
      // cancel_url. The cancel_url path handles the common case instantly; this
      // handles tab-close / link-sharing scenarios after the 24h session expiry.
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await prisma().userMembership.deleteMany({
          where: {
            stripeCheckoutSessionId: session.id,
            status: 'pending',
          },
        })
        break
      }

      default:
        // Unhandled event — return 200 to acknowledge receipt to Stripe
        break
    }
  } catch (err) {
    // Reason: P2003 = FK constraint — userId/tierId from Stripe metadata doesn't
    // exist in the DB (e.g. staging reset with stale Stripe test events). Returning
    // 200 prevents Stripe from retrying an event that can never succeed.
    const code = (err as { code?: string })?.code
    if (code === 'P2003') {
      console.warn(
        'Webhook skipped: FK constraint — user or tier not found in DB',
        {
          event: event.type,
          code,
        },
      )
      return NextResponse.json({ received: true, skipped: true })
    }
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
