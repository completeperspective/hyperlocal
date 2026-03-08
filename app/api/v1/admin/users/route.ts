import { NextResponse } from 'next/server'
import { keystoneContext } from '~/lib/server/keystone/context'
import { apiHandler } from '@/server/api'

async function getUsersHandler() {
  const users = await keystoneContext.sudo().graphql.run({
    query: `
      query GetUsers {
        users {
          id
          email
          isAdmin
        }
      }
    `,
  })

  return NextResponse.json({ data: users })
}

export const GET = apiHandler(getUsersHandler)
