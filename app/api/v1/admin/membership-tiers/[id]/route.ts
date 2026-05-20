import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import { stripe } from '@/server/payments/stripe'

const UpdateTierSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceInCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  contentAccessPatterns: z.array(z.string()).optional(),
})

async function getTierHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const tier = await keystoneContext.sudo().db.MembershipTier.findOne({
    where: { id },
  })

  if (!tier) {
    return NextResponse.json({ message: 'Tier not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...tier,
    // Reason: normalize contentAccessPatterns from DB JSON to string[]
    contentAccessPatterns: Array.isArray(
      (tier as Record<string, unknown>).contentAccessPatterns,
    )
      ? ((tier as Record<string, unknown>).contentAccessPatterns as string[])
      : [],
  })
}

async function updateTierHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const parsed = UpdateTierSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const existing = await keystoneContext.sudo().db.MembershipTier.findOne({
    where: { id },
  })

  if (!existing) {
    return NextResponse.json({ message: 'Tier not found' }, { status: 404 })
  }

  // Reason: an empty contentAccessPatterns on a paid tier silently grants access to
  // ALL gated content — require explicit patterns or a zero price.
  // The PATCH body is partial, so derive the effective post-update values by falling
  // back to the current DB values for whichever field is absent from the request.
  const effectivePrice =
    parsed.data.priceInCents !== undefined
      ? parsed.data.priceInCents
      : (existing.priceInCents as number)
  const effectivePatterns =
    parsed.data.contentAccessPatterns !== undefined
      ? parsed.data.contentAccessPatterns
      : Array.isArray(
            (existing as Record<string, unknown>).contentAccessPatterns,
          )
        ? ((existing as Record<string, unknown>)
            .contentAccessPatterns as string[])
        : []
  if (effectivePrice > 0 && effectivePatterns.length === 0) {
    return NextResponse.json(
      {
        error:
          'Paid tiers must have at least one content access pattern. Set patterns or set price to 0.',
      },
      { status: 422 },
    )
  }

  // Build the update payload — only include fields that were provided
  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name
  if (parsed.data.description !== undefined)
    updatePayload.description = parsed.data.description
  if (parsed.data.priceInCents !== undefined)
    updatePayload.priceInCents = parsed.data.priceInCents
  if (parsed.data.isActive !== undefined)
    updatePayload.isActive = parsed.data.isActive
  if (parsed.data.contentAccessPatterns !== undefined)
    updatePayload.contentAccessPatterns = parsed.data.contentAccessPatterns

  const updated = await keystoneContext.sudo().db.MembershipTier.updateOne({
    where: { id },
    data: updatePayload as never,
  })

  let stripeWarning: string | undefined

  const stripeProductId = existing.stripeProductId as string | null
  const stripePriceId = existing.stripePriceId as string | null
  const hasStripe = !!(stripeProductId && process.env.STRIPE_SECRET_KEY)

  // Sync updated price to Stripe by creating a new price and deactivating the old one
  if (
    parsed.data.priceInCents !== undefined &&
    parsed.data.priceInCents !== (existing.priceInCents as number) &&
    hasStripe &&
    stripeProductId
  ) {
    try {
      const newPrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: parsed.data.priceInCents,
        // Reason: currency is immutable on existing Stripe prices; use the tier's stored
        // currency so a price-amount change doesn't silently switch currencies.
        currency:
          ((existing as Record<string, unknown>).currency as string) || 'usd',
      })

      await keystoneContext.sudo().db.MembershipTier.updateOne({
        where: { id },
        data: { stripePriceId: newPrice.id },
      })

      if (stripePriceId) {
        await stripe.prices.update(stripePriceId, { active: false })
      }
    } catch (err) {
      console.error('Stripe price update failed:', err)
      stripeWarning =
        err instanceof Error ? err.message : 'Stripe price update failed'
    }
  }

  // Sync updated name to Stripe product
  if (
    parsed.data.name &&
    parsed.data.name !== existing.name &&
    hasStripe &&
    stripeProductId
  ) {
    try {
      await stripe.products.update(stripeProductId, { name: parsed.data.name })
    } catch (err) {
      console.error('Stripe product name update failed:', err)
      stripeWarning =
        err instanceof Error ? err.message : 'Stripe product update failed'
    }
  }

  return NextResponse.json({
    ...updated,
    ...(stripeWarning ? { stripeWarning } : {}),
  })
}

async function deleteTierHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const tier = await keystoneContext.sudo().db.MembershipTier.findOne({
    where: { id },
  })

  if (!tier) {
    return NextResponse.json({ message: 'Tier not found' }, { status: 404 })
  }

  const memberCount = await keystoneContext.sudo().db.UserMembership.count({
    where: {
      tier: { id: { equals: id } },
      status: { in: ['pending', 'active'] },
    },
  })

  if (memberCount > 0) {
    return NextResponse.json(
      { message: 'Cannot delete tier with active members', memberCount },
      { status: 409 },
    )
  }

  const stripePriceId = tier.stripePriceId as string | null
  const stripeProductId = tier.stripeProductId as string | null

  // Reason: orphaned active Stripe records are worse than a failed delete; force admin to retry
  if ((stripePriceId || stripeProductId) && process.env.STRIPE_SECRET_KEY) {
    try {
      if (stripePriceId) {
        await stripe.prices.update(stripePriceId, { active: false })
      }
      if (stripeProductId) {
        await stripe.products.update(stripeProductId, { active: false })
      }
    } catch (err) {
      return NextResponse.json(
        {
          message: 'Stripe cleanup failed. Tier not deleted.',
          error: err instanceof Error ? err.message : 'Unknown Stripe error',
        },
        { status: 502 },
      )
    }
  }

  await keystoneContext.sudo().db.MembershipTier.deleteOne({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const GET = apiHandler(getTierHandler)
export const PATCH = apiHandler(updateTierHandler)
export const DELETE = apiHandler(deleteTierHandler)
