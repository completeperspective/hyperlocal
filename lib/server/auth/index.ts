import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from '@/server/keystone/session'

export async function isAuthenticated() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions,
    )
    if (session?.data) {
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function getSession() {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions,
    )
    if (session?.data) {
      return session
    }
    return { data: null }
  } catch {
    return { data: null }
  }
}
