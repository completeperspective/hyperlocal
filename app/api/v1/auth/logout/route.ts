import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { apiHandler } from '@/server/api'
import { SessionData, sessionOptions } from '@/server/keystone/session'

async function logoutHandler() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )
  console.log('DELETE /api/v1/auth', { session })
  if (session.data) {
    await session.destroy()
  }
  return new Response(null, {
    status: 204,
  })
}

export const DELETE = apiHandler(logoutHandler)
