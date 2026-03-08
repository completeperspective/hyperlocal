import 'dotenv/config'
import { config } from '@keystone-6/core'
import { session, withAuth } from './auth'
import { lists } from './schema'

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://localhost:5432/webapp_dev'

export default withAuth(
  config({
    session,
    lists,
    db: {
      provider: 'postgresql',
      url: DATABASE_URL,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onConnect: async (context) => {
        console.log('💾 Connected to database')
      },
      // Optional advanced configuration
      enableLogging: true,
    },
    ui: {
      isDisabled: false,
      isAccessAllowed: (context) => !!context?.session?.data?.isAdmin,
    },
    storage: {
      images: {
        kind: 'local',
        type: 'image',
        storagePath: './public/images',
        serverRoute: { path: '/images' },
        generateUrl: (path) => `/images${path}`,
      },
    },
  }),
)
