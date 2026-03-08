'use server'

import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/server/keystone/session'

export async function logout() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )

  if (session.data) {
    await session.destroy()
  }
}
