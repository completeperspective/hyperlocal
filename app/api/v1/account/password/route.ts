import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'

async function changePassword(req: NextRequest) {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) throw new ApiError(401, 'Unauthorized')

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword)
    throw new ApiError(400, 'Both passwords required')
  if (newPassword.length < 8)
    throw new ApiError(400, 'New password must be at least 8 characters')

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
    variables: { email: sessionData.email, password: currentPassword },
  })

  if (!result?.authenticateUserWithPassword?.sessionToken) {
    throw new ApiError(401, 'Current password is incorrect')
  }

  await keystoneContext.sudo().db.User.updateOne({
    where: { id: sessionData.id },
    data: { recoveryPhrase: newPassword },
  })

  return NextResponse.json({ ok: true })
}

export const POST = apiHandler(changePassword)
