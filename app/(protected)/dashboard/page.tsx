import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth'
import { AppSettings } from '@/server/helpers/AppSettings'
import { getAllEnrollmentStats } from '@/server/helpers/get-course-progress'
import { getPageMetadata } from '@/server/helpers/get-metadata'
import { keystoneContext } from '@/server/keystone/context'
import type { MembershipTier, UserMembership } from '@/types/membership'
import { ProfileCompletionBanner } from '@/ui/profile-completion-banner'
import {
  DashboardCourseSection,
  DashboardMembershipSection,
} from './dashboard-client'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Dashboard')
}

const prisma = () => keystoneContext.prisma

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const appSettings = await AppSettings.instance.settings()
  const _s = await searchParams

  const { data: sessionData } = await getSession()

  // Reason: Stripe has no instant cancel event — the cancel_url lands here with
  // ?checkout=cancelled. Clean up the stale pending record so the dashboard
  // doesn't show "Processing Membership" for a cancelled session, then redirect
  // to strip the query param from the URL.
  if (_s?.checkout === 'cancelled' && sessionData?.id) {
    await prisma().userMembership.deleteMany({
      where: { userId: sessionData.id, status: 'pending' },
    })
    redirect('/dashboard')
  }

  const portalReturned = _s?.portal === 'returned'

  // Reason: use prisma directly — Keystone query layer returns non-plain objects
  // that React's Server→Client serializer rejects even after JSON.parse/stringify.
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

  let membershipRaw: MembershipRaw | null = null

  if (sessionData?.id) {
    const activeMemberships = await prisma().userMembership.findMany({
      where: { userId: sessionData.id, status: 'active' },
      select: membershipSelect,
      orderBy: { id: 'asc' },
    })

    if (activeMemberships.length > 0) {
      // Reason: show the highest-value membership in the status banner when
      // the user holds multiple active memberships simultaneously.
      membershipRaw = activeMemberships.reduce((best, m) =>
        (m.tier?.priceInCents ?? 0) > (best.tier?.priceInCents ?? 0) ? m : best,
      ) as MembershipRaw
    } else {
      // No active memberships — fall back to most recent for status display
      // (pending, failed, expired, blocked states)
      membershipRaw =
        ((await prisma().userMembership.findFirst({
          where: { userId: sessionData.id },
          select: membershipSelect,
          orderBy: { id: 'desc' },
        })) as MembershipRaw | null) ?? null
    }
  }

  const courseProgressStats = sessionData?.id
    ? await getAllEnrollmentStats(sessionData.id)
    : []

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
    <main className="grid min-h-[calc(100vh-var(--header-height))] grid-rows-[1fr_auto]">
      <section className="flex w-full flex-col h-full p-4 md:py-8">
        <ProfileCompletionBanner nickname={sessionData?.profile?.nickname} />
        <DashboardMembershipSection
          currentMembership={currentMembership}
          portalReturned={portalReturned}
        />
        <DashboardCourseSection stats={courseProgressStats} />
      </section>
      <footer className="py-6 gap-6 flex flex-wrap items-center justify-center">
        <p className="text-xs text-muted-foreground">
          {appSettings?.copyright}
        </p>
      </footer>
    </main>
  )
}
