import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { keystoneContext } from '@/server/keystone/context'
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

export async function refreshUserSession(userId: string): Promise<void> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )
  if (!session.data) return

  const [user, memberships] = await Promise.all([
    keystoneContext.sudo().query.User.findOne({
      where: { id: userId },
      query:
        'id name email isAdmin profile { nickname description location isPublic image { source { publicUrl } } }',
    }),
    keystoneContext.sudo().query.UserMembership.findMany({
      where: { user: { id: { equals: userId } }, status: { equals: 'active' } },
      query: 'id',
    }),
  ])

  if (!user) return

  session.data = {
    ...session.data,
    ...(user as SessionData['data']),
    isMember: memberships.length > 0,
  } as SessionData['data']

  await session.save()
}
