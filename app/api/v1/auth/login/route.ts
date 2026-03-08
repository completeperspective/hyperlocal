import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import { AuthResponse } from '@/types'

async function authenticateUserHandler(req: NextRequest) {
  const body = await req.json()

  if (!body.email || !body.password) {
    throw new ApiError(400, 'Missing required parameters')
  }

  const { email, password } = body

  const auth: AuthResponse = await keystoneContext.sudo().graphql.run({
    query: `
      mutation Login($email: String!, $password: String!) {
        authenticateUserWithPassword(email: $email, recoveryPhrase: $password) {
          ... on UserAuthenticationWithPasswordSuccess {
            sessionToken
            item {
              id
              email
              isAdmin
            }
          }
          ... on UserAuthenticationWithPasswordFailure {
            message
          }
        }
    }`,
    variables: {
      email,
      password,
    },
  })

  if (!auth?.authenticateUserWithPassword?.sessionToken) {
    return NextResponse.json(
      {
        message: auth?.authenticateUserWithPassword?.message,
      },
      { status: 401 },
    )
  }

  const { item } = auth?.authenticateUserWithPassword
  const user = {
    id: item?.id,
    email: item?.email,
    isAdmin: item?.isAdmin,
  }

  return NextResponse.json({
    user,
  })
}

export const POST = apiHandler(authenticateUserHandler)
