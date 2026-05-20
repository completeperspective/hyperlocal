import type { Metadata } from 'next'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import type { MembershipTier, UserMembership } from '@/types/membership'
import { SettingsPageClient } from './settings-page-client'

export const metadata: Metadata = { title: 'Settings' }

const prisma = () => keystoneContext.prisma

const membershipSelect = {
  id: true,
  status: true,
  paymentMethod: true,
  activatedAt: true,
  expiresAt: true,
  tier: {
    select: {
      id: true,
      name: true,
      priceInCents: true,
      paymentType: true,
      contentAccessPatterns: true,
    },
  },
} as const

type MembershipRaw = {
  id: string
  status: string | null
  paymentMethod: string | null
  activatedAt: Date | null
  expiresAt: Date | null
  tier: {
    id: string
    name: string
    priceInCents: number | null
    paymentType: string | null
    // Reason: Prisma returns Json fields as JsonValue (null | string | number | ...[])
    // We cast to string[] after asserting it's an array at runtime.
    contentAccessPatterns: unknown
  } | null
}

export default async function SettingsPage() {
  const { data: sessionData } = await getSession()

  const user = sessionData?.id
    ? await keystoneContext.sudo().query.User.findOne({
        where: { id: sessionData.id },
        query:
          'id name email mobile profile { nickname description location isPublic contactPreference image { source { publicUrl } } }',
      })
    : null

  const profile = user?.profile as
    | {
        nickname?: string
        description?: string
        location?: string
        isPublic?: boolean
        contactPreference?: string
        image?: { source?: { publicUrl?: string } }
      }
    | null
    | undefined

  let membershipRaw: MembershipRaw | null = null

  if (sessionData?.id) {
    const activeMemberships = await prisma().userMembership.findMany({
      where: { userId: sessionData.id, status: 'active' },
      select: membershipSelect,
      orderBy: { id: 'asc' },
    })

    if (activeMemberships.length > 0) {
      membershipRaw = activeMemberships.reduce((best, m) =>
        (m.tier?.priceInCents ?? 0) > (best.tier?.priceInCents ?? 0) ? m : best,
      ) as MembershipRaw
    } else {
      membershipRaw =
        ((await prisma().userMembership.findFirst({
          where: { userId: sessionData.id },
          select: membershipSelect,
          orderBy: { id: 'desc' },
        })) as MembershipRaw | null) ?? null
    }
  }

  const currentMembership: UserMembership | null = membershipRaw
    ? {
        id: membershipRaw.id,
        status: (membershipRaw.status as UserMembership['status']) ?? 'pending',
        paymentMethod:
          (membershipRaw.paymentMethod as UserMembership['paymentMethod']) ??
          null,
        activatedAt: membershipRaw.activatedAt?.toISOString() ?? null,
        expiresAt: membershipRaw.expiresAt?.toISOString() ?? null,
        tier: membershipRaw.tier
          ? {
              id: membershipRaw.tier.id,
              name: membershipRaw.tier.name ?? '',
              description: null,
              priceInCents: membershipRaw.tier.priceInCents ?? 0,
              paymentType:
                (membershipRaw.tier
                  .paymentType as MembershipTier['paymentType']) ?? 'one_time',
              stripeProductId: null,
              stripePriceId: null,
              isActive: true,
              contentAccessPatterns: Array.isArray(
                membershipRaw.tier.contentAccessPatterns,
              )
                ? (membershipRaw.tier.contentAccessPatterns as string[])
                : [],
            }
          : null,
      }
    : null

  return (
    <div className="min-h-[calc(100vh-var(--header-height))]">
      <SettingsPageClient
        name={(user?.name as string | null) ?? null}
        email={(user?.email as string) ?? ''}
        mobile={(user?.mobile as string | null) ?? null}
        nickname={profile?.nickname ?? null}
        description={profile?.description ?? null}
        location={profile?.location ?? null}
        isPublic={profile?.isPublic ?? false}
        contactPreference={profile?.contactPreference ?? null}
        imageUrl={profile?.image?.source?.publicUrl ?? null}
        userName={profile?.nickname ?? (user?.name as string | null) ?? null}
        currentMembership={currentMembership}
      />
    </div>
  )
}
