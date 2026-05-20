import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

async function registerAndLogin(req: NextRequest) {
  const body = await req.json()
  const { name, email, password } = body

  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required')
  }

  const existing = await keystoneContext.sudo().query.User.findOne({
    where: { email },
    query: 'id',
  })

  if (existing) {
    throw new ApiError(409, 'An account with that email already exists')
  }

  await keystoneContext.sudo().graphql.run({
    query: `
      mutation CreateUser($data: UserCreateInput!) {
        createUser(data: $data) { id }
      }
    `,
    variables: {
      data: { name, email, recoveryPhrase: password },
    },
  })

  // Authenticate immediately after creation — Keystone's session.start() sets the iron-session cookie.
  const authResult = await keystoneContext.graphql.run<
    { authenticateUserWithPassword?: { sessionToken?: string } },
    Record<string, unknown>
  >({
    query: `
      mutation Login($email: String!, $password: String!) {
        authenticateUserWithPassword(email: $email, recoveryPhrase: $password) {
          ... on UserAuthenticationWithPasswordSuccess { sessionToken }
          ... on UserAuthenticationWithPasswordFailure { message }
        }
      }`,
    variables: { email, password },
  })

  const token = authResult?.authenticateUserWithPassword?.sessionToken
  if (!token) {
    throw new ApiError(500, 'Account created but auto-login failed')
  }

  return NextResponse.json({ ok: true })
}

export const POST = apiHandler(registerAndLogin)
