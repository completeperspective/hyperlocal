import { NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type { UserStats } from '@/types/users-admin'

const ACTIVE_MEMBERSHIPS_QUERY = `
  query {
    userMemberships(where: { status: { equals: "active" } }) {
      tier { priceInCents }
    }
  }
`

async function getUserStatsHandler(): Promise<NextResponse> {
  const [totalUsers, activeMembers, activeMembershipsResult] =
    await Promise.all([
      keystoneContext.sudo().db.User.count({}),
      keystoneContext.sudo().db.UserMembership.count({
        where: { status: { equals: 'active' } },
      }),
      keystoneContext.sudo().graphql.run({ query: ACTIVE_MEMBERSHIPS_QUERY }),
    ])

  const activeMemberships = (
    activeMembershipsResult as {
      userMemberships: Array<{ tier: { priceInCents: number } | null }>
    }
  ).userMemberships

  // Estimate MRR from sum of active tier prices
  const mrrEstimateCents = activeMemberships.reduce(
    (sum, m) => sum + (m.tier?.priceInCents ?? 0),
    0,
  )

  return NextResponse.json({
    totalUsers,
    activeMembers,
    mrrEstimateCents,
  } satisfies UserStats)
}

export const GET = apiHandler(getUserStatsHandler)
