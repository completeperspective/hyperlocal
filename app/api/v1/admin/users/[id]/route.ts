import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type {
  MembershipStatus,
  PaymentMethod,
  UserDetail,
} from '@/types/users-admin'

const GET_USER_DETAIL_QUERY = `
  query GetUserDetail($id: ID!) {
    user(where: { id: $id }) {
      id
      email
      name
      mobile
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
      learnerProfile {
        totalLessonsCompleted
        totalCoursesCompleted
        lastActiveAt
        enrollmentsCount
      }
    }
  }
`

const GET_USER_MEMBERSHIPS_QUERY = `
  query GetUserMembershipsForDetail($where: UserMembershipWhereInput) {
    userMemberships(where: $where, orderBy: [{ activatedAt: desc }], take: 1) {
      id
      status
      paymentMethod
      activatedAt
      expiresAt
      stripeSubscriptionId
      cryptoTxHash
      tier { id name priceInCents paymentType }
    }
  }
`

async function getUserDetailHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const result = (await keystoneContext.sudo().graphql.run({
    query: GET_USER_DETAIL_QUERY,
    variables: { id },
  })) as {
    user: {
      id: string
      email: string
      name: string | null
      mobile: string | null
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
      learnerProfile: {
        totalLessonsCompleted: number | null
        totalCoursesCompleted: number | null
        lastActiveAt: string | null
        enrollmentsCount: number
      } | null
    } | null
  }

  if (!result.user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  const u = result.user

  const membershipsResult = (await keystoneContext.sudo().graphql.run({
    query: GET_USER_MEMBERSHIPS_QUERY,
    variables: { where: { user: { id: { equals: id } } } },
  })) as {
    userMemberships: Array<{
      id: string
      status: string
      paymentMethod: string | null
      activatedAt: string | null
      expiresAt: string | null
      stripeSubscriptionId: string | null
      cryptoTxHash: string | null
      tier: {
        id: string
        name: string
        priceInCents: number
        paymentType: string
      } | null
    }>
  }

  const m = membershipsResult.userMemberships[0] ?? null

  const detail: UserDetail = {
    id: u.id,
    email: u.email,
    name: u.name,
    mobile: u.mobile,
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
    learnerProfile: u.learnerProfile
      ? {
          totalLessonsCompleted: u.learnerProfile.totalLessonsCompleted ?? 0,
          totalCoursesCompleted: u.learnerProfile.totalCoursesCompleted ?? 0,
          lastActiveAt: u.learnerProfile.lastActiveAt,
        }
      : null,
  }

  return NextResponse.json(detail)
}

const PatchUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  membershipStatus: z
    .enum(['pending', 'active', 'expired', 'failed', 'blocked'])
    .optional(),
  membershipId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  mobile: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  profile: z
    .object({
      nickname: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      isPublic: z.boolean().optional(),
      contactPreference: z.enum(['email', 'sms', 'both', 'none']).optional(),
    })
    .optional(),
})

async function patchUserHandler(
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }
  const body = await req.json()
  const parsed = PatchUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const {
    isAdmin,
    membershipStatus,
    membershipId,
    email,
    name,
    mobile,
    newPassword,
    profile,
  } = parsed.data

  if (isAdmin !== undefined) {
    await keystoneContext.sudo().db.User.updateOne({
      where: { id },
      data: { isAdmin },
    })
  }

  if (membershipStatus !== undefined && membershipId) {
    await keystoneContext.sudo().db.UserMembership.updateOne({
      where: { id: membershipId },
      data: { status: membershipStatus },
    })
  }

  // Handle user-level field updates (email, name, mobile, password)
  const userUpdate: Record<string, unknown> = {}
  if (email !== undefined) userUpdate.email = email
  if (name !== undefined) userUpdate.name = name
  if (mobile !== undefined) userUpdate.mobile = mobile
  if (newPassword !== undefined) userUpdate.recoveryPhrase = newPassword

  if (Object.keys(userUpdate).length > 0) {
    try {
      await keystoneContext
        .sudo()
        .db.User.updateOne({ where: { id }, data: userUpdate })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('Unique constraint') && message.includes('email')) {
        return NextResponse.json(
          { message: 'An account with that email already exists.' },
          { status: 409 },
        )
      }
      if (message.includes('Unique constraint') && message.includes('mobile')) {
        return NextResponse.json(
          { message: 'An account with that mobile number already exists.' },
          { status: 409 },
        )
      }
      throw err
    }
  }

  // Handle profile updates
  if (profile !== undefined) {
    const existingUser = await keystoneContext.sudo().query.User.findOne({
      where: { id },
      query: 'profile { id }',
    })
    const profileId = existingUser?.profile?.id
    if (profileId) {
      await keystoneContext.sudo().db.Profile.updateOne({
        where: { id: profileId as string },
        data: profile,
      })
    } else {
      await keystoneContext.sudo().db.Profile.createOne({
        data: { owner: { connect: { id } }, ...profile } as unknown as Record<
          string,
          unknown
        >,
      })
    }
  }

  return NextResponse.json({ updated: true })
}

async function deleteUserHandler(
  _req: NextRequest,
  ctx?: { params?: Promise<unknown> },
): Promise<NextResponse> {
  const { id } = (await ctx?.params) as { id: string }

  const existing = await keystoneContext
    .sudo()
    .db.User.findOne({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  await keystoneContext.sudo().db.User.deleteOne({ where: { id } })

  return new NextResponse(null, { status: 204 })
}

export const GET = apiHandler(getUserDetailHandler)
export const PATCH = apiHandler(patchUserHandler)
export const DELETE = apiHandler(deleteUserHandler)
