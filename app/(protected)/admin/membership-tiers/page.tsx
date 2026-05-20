import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { keystoneContext } from '@/server/keystone/context'
import type { RecurringInterval, TierRow } from '@/types/membership-tiers-admin'
import { TierTableSection } from './components/tier-table-section'

export const metadata: Metadata = { title: 'Membership Tiers' }

export default async function MembershipTiersPage() {
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
        contentAccessPatterns: Array.isArray(
          (tier as Record<string, unknown>).contentAccessPatterns,
        )
          ? ((tier as Record<string, unknown>)
              .contentAccessPatterns as string[])
          : [],
      }
    }),
  )

  // Reason: Keystone returns non-plain objects; JSON round-trip makes them safe to pass to client components
  const plainTiers = JSON.parse(JSON.stringify(tiers)) as TierRow[]

  return (
    <section className="p-4 max-w-6xl sm:mx-auto space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Membership Tiers</h1>
          <p className="text-muted-foreground mt-1">
            Manage pricing tiers and Stripe products
          </p>
        </div>
      </div>
      <TierTableSection tiers={plainTiers} />
    </section>
  )
}
