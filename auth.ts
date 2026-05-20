import 'dotenv/config'
import { createAuth } from '@keystone-6/auth'
import { statelessSessions } from '@keystone-6/core/session'

const session = statelessSessions({
  cookieName: process.env.AUTH_SESSION_NAME! + '-admin' || 'web-app-admin',
  maxAge: parseInt(process.env.AUTH_SESSION_EXPIRES!, 10) || 60 * 60 * 24 * 360,
  secret:
    process.env.AUTH_SESSION_SECRET! || 'shouldbeatleast32characters123456789',
})

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'recoveryPhrase',
  sessionData: 'id name email isAdmin',
  initFirstItem: {
    fields: ['name', 'email', 'recoveryPhrase', 'isAdmin'],
    skipKeystoneWelcome: true,
  },
})

export { withAuth, session }
