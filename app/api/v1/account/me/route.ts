import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'

async function getAuthenticatedUser(req: NextRequest, res: NextResponse) {
  const session = await getSession()

  return NextResponse.json(session?.data)
}

export const GET = apiHandler(getAuthenticatedUser)
