import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type {
  MembershipStatus,
  PaymentMethod,
  UserRow,
  UsersListResponse,
} from '@/types/users-admin'

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
  // Reason: When filtering by membership status/tier, we pre-fetch matching user IDs
  // from UserMembership (no reverse relationship exists on User).
  if (filters.membershipUserIds !== null) {
    conditions.push({ id: { in: filters.membershipUserIds } })
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}

async function getUsersHandler(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q') ?? ''
  const status = sp.get('status') ?? ''
  const tier = sp.get('tier') ?? ''
  const role = sp.get('role') ?? ''
  const wallet = sp.get('wallet') ?? ''
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(sp.get('pageSize') ?? '25', 10)),
  )

  // Reason: UserMembership has no reverse relationship on User, so membership
  // filters are resolved first to get matching user IDs.
  let membershipUserIds: string[] | null = null
  if (status || tier) {
    const membershipWhere: Record<string, unknown> = {}
    if (status) membershipWhere.status = { equals: status }
    if (tier) membershipWhere.tier = { id: { equals: tier } }

    const membershipsForFilter = (await keystoneContext.sudo().graphql.run({
      query: `query($where: UserMembershipWhereInput) { userMemberships(where: $where) { user { id } } }`,
      variables: { where: membershipWhere },
    })) as { userMemberships: Array<{ user: { id: string } | null }> }

    membershipUserIds = membershipsForFilter.userMemberships
      .map((m) => m.user?.id)
      .filter((id): id is string => Boolean(id))
  }

  const where = buildUserWhere({ q, role, wallet, membershipUserIds })

  const result = (await keystoneContext.sudo().graphql.run({
    query: GET_USERS_QUERY,
    variables: { where, take: pageSize, skip: (page - 1) * pageSize },
  })) as {
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

  const userIds = result.users.map((u) => u.id)

  // Fetch latest non-blocked membership per user in one query
  const membershipsResult = userIds.length
    ? ((await keystoneContext.sudo().graphql.run({
        query: GET_MEMBERSHIPS_QUERY,
        variables: { where: { user: { id: { in: userIds } } } },
      })) as {
        userMemberships: Array<{
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
        }>
      })
    : { userMemberships: [] }

  // Build a map: userId → most-recent non-blocked membership
  const membershipMap = new Map<
    string,
    (typeof membershipsResult.userMemberships)[0]
  >()
  for (const m of membershipsResult.userMemberships) {
    if (m.status === 'blocked') continue
    if (!membershipMap.has(m.user.id)) {
      membershipMap.set(m.user.id, m)
    }
  }

  const users: UserRow[] = result.users.map((u) => {
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

  const totalCount = result.usersCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return NextResponse.json({
    users,
    totalCount,
    page,
    pageSize,
    totalPages,
  } satisfies UsersListResponse)
}

const CreateUserSchema = z.object({
  email: z.string().email(),
  isAdmin: z.boolean().default(false),
})

async function createUserHandler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json()
  const parsed = CreateUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const user = await keystoneContext.sudo().db.User.createOne({
    data: {
      name: parsed.data.email.split('@')[0],
      email: parsed.data.email,
      isAdmin: parsed.data.isAdmin,
    },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}

export const GET = apiHandler(getUsersHandler)
export const POST = apiHandler(createUserHandler)
