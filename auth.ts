import 'dotenv/config'
import { createAuth } from '@keystone-6/auth'
import { statelessSessions } from '@keystone-6/core/session'

const session = statelessSessions({
  cookieName:
    (process.env.AUTH_SESSION_NAME as string) + '-admin' || 'web-app-admin',
  maxAge:
    parseInt(process.env.AUTH_SESSION_EXPIRES as string, 10) ||
    60 * 60 * 24 * 360,
  secret:
    process.env.AUTH_SESSION_SECRET || 'needstobeatleast32characters12345',
})

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'recoveryPhrase',
  sessionData: 'id name email isAdmin', // fields available in session.data
  initFirstItem: {
    fields: ['name', 'email', 'recoveryPhrase', 'isAdmin'],
    skipKeystoneWelcome: true,
  },
})

export { withAuth, session }
