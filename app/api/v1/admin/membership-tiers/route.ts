import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type {
  RecurringInterval,
  TierRow,
  TiersListResponse,
} from '@/types/membership-tiers-admin'

const CreateTierSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceInCents: z.number().int().min(0),
  currency: z.enum(['usd', 'cad']).default('usd'),
  paymentType: z.enum(['free', 'one_time', 'subscription']),
  recurringInterval: z.enum(['week', 'month', 'year']).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  contentAccessPatterns: z.array(z.string()).optional().default([]),
})

async function getTiersHandler(): Promise<NextResponse> {
  const rawTiers = await keystoneContext.sudo().db.MembershipTier.findMany({
    orderBy: [{ name: 'asc' }],
  })

  const tiers: TierRow[] = await Promise.all(
    rawTiers.map(async (tier) => {
      const memberCount = await keystoneContext.sudo().db.UserMembership.count({
        where: {
          tier: { id: { equals: tier.id } },
          status: { not: { equals: 'blocked' } },
        },
      })

      return {
        id: tier.id,
        name: tier.name as string,
        description: (tier.description as string | null) ?? null,
        priceInCents: tier.priceInCents as number,
        currency: (((tier as Record<string, unknown>).currency as string) ||
          'usd') as 'usd' | 'cad',
        paymentType: tier.paymentType as 'free' | 'one_time' | 'subscription',
        recurringInterval:
          ((tier as Record<string, unknown>)
            .recurringInterval as RecurringInterval | null) ?? null,
        isActive: tier.isActive as boolean,
        stripeProductId: (tier.stripeProductId as string | null) ?? null,
        stripePriceId: (tier.stripePriceId as string | null) ?? null,
        memberCount,
        // Reason: contentAccessPatterns is stored as JSON; normalize to string[]
        // since Prisma client types don't yet reflect this field after migration.
        contentAccessPatterns: Array.isArray(
          (tier as Record<string, unknown>).contentAccessPatterns,
        )
          ? ((tier as Record<string, unknown>)
              .contentAccessPatterns as string[])
          : [],
      }
    }),
  )

  return NextResponse.json({
    tiers,
    totalCount: tiers.length,
  } satisfies TiersListResponse)
}

async function createTierHandler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const parsed = CreateTierSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Reason: an empty contentAccessPatterns on a paid tier silently grants access to
  // ALL gated content — require explicit patterns or a zero price.
  const patterns = parsed.data.contentAccessPatterns ?? []
  if ((parsed.data.priceInCents ?? 0) > 0 && patterns.length === 0) {
    return NextResponse.json(
      {
        error:
          'Paid tiers must have at least one content access pattern. Set patterns or set price to 0.',
      },
      { status: 422 },
    )
  }

  // Reason: currency and recurringInterval are absent from the generated Keystone type until
  // the DB migration runs and `pnpm db:generate` regenerates the Prisma client. Cast to bypass.
  // Reason: omit recurringInterval entirely when null — passing null for a nullable select field
  // throws a Keystone GraphQL validation error ("Field not defined by type MembershipTierCreateInput")
  // if the runtime schema hasn't reloaded after the migration. Omitting is always safe.
  const createData = {
    name: parsed.data.name,
    description: parsed.data.description ?? '',
    priceInCents: parsed.data.priceInCents,
    currency: parsed.data.currency,
    paymentType: parsed.data.paymentType,
    ...(parsed.data.recurringInterval != null
      ? { recurringInterval: parsed.data.recurringInterval }
      : {}),
    isActive: parsed.data.isActive,
    contentAccessPatterns: parsed.data.contentAccessPatterns ?? [],
  } as unknown as { name: string }

  const tier = await keystoneContext
    .sudo()
    .db.MembershipTier.createOne({ data: createData })

  return NextResponse.json(tier, { status: 201 })
}

export const GET = apiHandler(getTiersHandler)
export const POST = apiHandler(createTierHandler)
