import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { keystoneContext } from '@/server/keystone/context'
import type {
  MembershipStatus,
  PaymentMethod,
  UserFilters,
  UserRow,
  UsersListResponse,
  UserStats,
} from '@/types/users-admin'
import { CommunicationRail } from '../users/components/communication-rail'
import { UserStatsBar } from '../users/components/user-stats-bar'
import {
  UserTableSection,
  UserTableSkeleton,
} from '../users/components/user-table-section'

export const metadata = { title: 'Community | Admin' }

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    tier?: string
    role?: string
    wallet?: string
    page?: string
  }>
}

const GET_USERS_QUERY = `
  query GetUsersAdmin($where: UserWhereInput, $take: Int, $skip: Int) {
    users(where: $where, take: $take, skip: $skip, orderBy: [{ email: asc }]) {
      id
      email
      isAdmin
      walletAddress
      profile {
        nickname
        location
        description
        isPublic
        contactPreference
        image { source { publicUrl } }
      }
    }
    usersCount(where: $where)
  }
`

const GET_MEMBERSHIPS_QUERY = `
  query GetUserMemberships($where: UserMembershipWhereInput) {
    userMemberships(where: $where, orderBy: [{ activatedAt: desc }]) {
      id
      status
      paymentMethod
      activatedAt
      expiresAt
      stripeSubscriptionId
      cryptoTxHash
      user { id }
      tier { id name priceInCents paymentType }
    }
  }
`

function buildUserWhere(filters: {
  q: string
  role: string
  wallet: string
  membershipUserIds: string[] | null
}) {
  const conditions: Record<string, unknown>[] = []

  if (filters.q) {
    conditions.push({
      OR: [
        { email: { contains: filters.q, mode: 'insensitive' } },
        { profile: { nickname: { contains: filters.q, mode: 'insensitive' } } },
      ],
    })
  }
  if (filters.role === 'admin') conditions.push({ isAdmin: { equals: true } })
  if (filters.role === 'member') conditions.push({ isAdmin: { equals: false } })
  if (filters.wallet === 'yes')
    conditions.push({ walletAddress: { not: { equals: null } } })
  if (filters.wallet === 'no')
    conditions.push({ walletAddress: { equals: null } })
  if (filters.membershipUserIds !== null) {
    conditions.push({ id: { in: filters.membershipUserIds } })
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}

export default async function AdminCommunityPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters: UserFilters = {
    q: params.q ?? '',
    status: params.status ?? '',
    tier: params.tier ?? '',
    role: params.role ?? '',
    wallet: params.wallet ?? '',
    page: Math.max(1, parseInt(params.page ?? '1', 10)),
    pageSize: 25,
  }

  type GqlUsersMembership = {
    id: string
    status: string
    paymentMethod: string | null
    activatedAt: string | null
    expiresAt: string | null
    stripeSubscriptionId: string | null
    cryptoTxHash: string | null
    user: { id: string }
    tier: {
      id: string
      name: string
      priceInCents: number
      paymentType: string
    } | null
  }

  // Resolve membership-based filters first (no reverse relationship on User)
  let membershipUserIds: string[] | null = null
  if (filters.status || filters.tier) {
    const membershipWhere: Record<string, unknown> = {}
    if (filters.status) membershipWhere.status = { equals: filters.status }
    if (filters.tier) membershipWhere.tier = { id: { equals: filters.tier } }
    const mFilterResult = (await keystoneContext.sudo().graphql.run({
      query: `query($where: UserMembershipWhereInput) { userMemberships(where: $where) { user { id } } }`,
      variables: { where: membershipWhere },
    })) as { userMemberships: Array<{ user: { id: string } | null }> }
    membershipUserIds = mFilterResult.userMemberships
      .map((m) => m.user?.id)
      .filter((id): id is string => Boolean(id))
  }

  const where = buildUserWhere({
    q: filters.q,
    role: filters.role,
    wallet: filters.wallet,
    membershipUserIds,
  })

  type GqlUsersResult = {
    users: Array<{
      id: string
      email: string
      isAdmin: boolean
      walletAddress: string | null
      profile: {
        nickname: string | null
        location: string | null
        description: string | null
        isPublic: boolean
        contactPreference: string | null
        image: { source: { publicUrl: string } | null } | null
      } | null
    }>
    usersCount: number
  }

  const [
    usersResult,
    tiersResult,
    totalUsers,
    activeMembers,
    activeMembershipsResult,
  ] = await Promise.all([
    keystoneContext.sudo().graphql.run({
      query: GET_USERS_QUERY,
      variables: {
        where,
        take: filters.pageSize,
        skip: (filters.page - 1) * filters.pageSize,
      },
    }) as Promise<GqlUsersResult>,
    keystoneContext.sudo().graphql.run({
      query: `query { membershipTiers(orderBy: [{ name: asc }]) { id name } }`,
    }) as Promise<{ membershipTiers: Array<{ id: string; name: string }> }>,
    keystoneContext.sudo().db.User.count({}),
    keystoneContext
      .sudo()
      .db.UserMembership.count({ where: { status: { equals: 'active' } } }),
    keystoneContext.sudo().graphql.run({
      query: `query { userMemberships(where: { status: { equals: "active" } }) { tier { priceInCents } } }`,
    }) as Promise<{
      userMemberships: Array<{ tier: { priceInCents: number } | null }>
    }>,
  ])

  // Join memberships to users
  const userIds = usersResult.users.map((u) => u.id)
  const membershipsResult = userIds.length
    ? ((await keystoneContext.sudo().graphql.run({
        query: GET_MEMBERSHIPS_QUERY,
        variables: { where: { user: { id: { in: userIds } } } },
      })) as { userMemberships: GqlUsersMembership[] })
    : { userMemberships: [] as GqlUsersMembership[] }

  const membershipMap = new Map<string, GqlUsersMembership>()
  for (const m of membershipsResult.userMemberships) {
    if (!membershipMap.has(m.user.id)) membershipMap.set(m.user.id, m)
  }

  const users: UserRow[] = usersResult.users.map((u) => {
    const m = membershipMap.get(u.id) ?? null
    return {
      id: u.id,
      email: u.email,
      isAdmin: u.isAdmin,
      walletAddress: u.walletAddress,
      profile: u.profile
        ? {
            nickname: u.profile.nickname,
            location: u.profile.location,
            description: u.profile.description,
            isPublic: u.profile.isPublic,
            contactPreference: u.profile.contactPreference,
            imageUrl: u.profile.image?.source?.publicUrl ?? null,
          }
        : null,
      membership: m
        ? {
            id: m.id,
            status: m.status as MembershipStatus,
            paymentMethod: m.paymentMethod as PaymentMethod | null,
            activatedAt: m.activatedAt,
            expiresAt: m.expiresAt,
            stripeSubscriptionId: m.stripeSubscriptionId,
            cryptoTxHash: m.cryptoTxHash,
            tier: m.tier
              ? {
                  id: m.tier.id,
                  name: m.tier.name,
                  priceInCents: m.tier.priceInCents,
                  paymentType: m.tier.paymentType,
                }
              : null,
          }
        : null,
    }
  })

  const totalCount = usersResult.usersCount
  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize))
  const usersData: UsersListResponse = {
    users,
    totalCount,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
  }

  const mrrEstimateCents = activeMembershipsResult.userMemberships.reduce(
    (sum, m) => sum + (m.tier?.priceInCents ?? 0),
    0,
  )

  const stats: UserStats = { totalUsers, activeMembers, mrrEstimateCents }
  // Reason: Keystone graphql.run returns objects with non-plain prototypes; Next.js
  // App Router requires plain serializable values when crossing the server→client boundary.
  const tiersTyped: Array<{ id: string; name: string }> = JSON.parse(
    JSON.stringify(tiersResult.membershipTiers),
  )
  const plainUsers: UserRow[] = JSON.parse(JSON.stringify(usersData.users))

  return (
    <div className="p-4 max-w-6xl sm:mx-auto space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Community Engagement
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage members and monitor growth
          </p>
        </div>
      </div>

      <UserStatsBar stats={stats} />

      <CommunicationRail />

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Members
          </h2>
        </div>
        <Suspense fallback={<UserTableSkeleton />}>
          <UserTableSection
            users={plainUsers}
            tiers={tiersTyped}
            totalCount={usersData.totalCount}
            currentPage={usersData.page}
            totalPages={usersData.totalPages}
            filters={filters}
          />
        </Suspense>
      </section>
    </div>
  )
}
