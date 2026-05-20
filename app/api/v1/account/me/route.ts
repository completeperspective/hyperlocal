import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getAuthenticatedUser(req: NextRequest) {
  const session = await getSession()
  return NextResponse.json(session?.data)
}

async function updateMe(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const body = await req.json()
  const { name, email, recoveryPhrase, mobile } = body

  try {
    await keystoneContext.sudo().db.User.updateOne({
      where: { id: sessionData.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(recoveryPhrase !== undefined ? { recoveryPhrase } : {}),
        ...(mobile !== undefined ? { mobile } : {}),
      },
    })
  } catch (err) {
    // Reason: Prisma unique constraint violations surface as GraphQLError wrapping
    // a PrismaClientKnownRequestError (P2002). Detect by message content and return
    // a 409 so the client can show a meaningful error instead of a generic 500.
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

  return NextResponse.json({ ok: true })
}

async function deleteMe(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const { password } = await req.json()
  if (!password) throw new ApiError(400, 'Password required')

  const result = await keystoneContext.graphql.run<
    {
      authenticateUserWithPassword?: { sessionToken?: string; message?: string }
    },
    Record<string, unknown>
  >({
    query: `
      mutation Verify($email: String!, $password: String!) {
        authenticateUserWithPassword(email: $email, recoveryPhrase: $password) {
          ... on UserAuthenticationWithPasswordSuccess { sessionToken }
          ... on UserAuthenticationWithPasswordFailure { message }
        }
      }`,
    variables: { email: sessionData.email, password },
  })

  if (!result?.authenticateUserWithPassword?.sessionToken) {
    throw new ApiError(401, 'Incorrect password')
  }

  // Must delete profile (FK) before user
  const user = await keystoneContext.sudo().query.User.findOne({
    where: { id: sessionData.id },
    query: 'profile { id }',
  })
  if (user?.profile?.id) {
    await keystoneContext
      .sudo()
      .db.Profile.deleteOne({ where: { id: user.profile.id as string } })
  }
  await keystoneContext
    .sudo()
    .db.User.deleteOne({ where: { id: sessionData.id } })

  return NextResponse.json({ ok: true })
}

export const GET = apiHandler(getAuthenticatedUser)
export const PATCH = apiHandler(updateMe)
export const DELETE = apiHandler(deleteMe)
