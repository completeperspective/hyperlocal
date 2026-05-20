import 'dotenv/config'
import { config } from '@keystone-6/core'
import cloudinary from 'cloudinary'
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
      onConnect: async () => {
        console.log('💾 Connected to database')
      },
      enableLogging: true,
    },
    ui: {
      isDisabled: false,
      isAccessAllowed: (context) => !!context?.session?.data?.isAdmin,
    },
    server: {
      extendExpressApp(app) {
        // Reason: the custom field view runs on the Keystone origin (same port as this server),
        // so putting the signature endpoint here avoids cross-origin issues.
        // Auth is enforced by the Keystone admin's isAccessAllowed gate — only admins
        // can reach the field view that calls this endpoint.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.post('/api/sign-upload', (_req: any, res: any) => {
          const timestamp = Math.round(Date.now() / 1000)
          const folder = process.env.CLOUDINARY_PROJECT ?? ''
          // Reason: resource_type is a URL path segment (/raw/upload), not a POST param,
          // so Cloudinary excludes it from the expected signature. Including it causes 401.
          // type: 'private' IS included in the signature because it is a POST param.
          const signature = cloudinary.v2.utils.api_sign_request(
            { timestamp, folder, type: 'private' },
            process.env.CLOUDINARY_SECRET!,
          )

          return res.json({
            signature,
            timestamp,
            api_key: process.env.CLOUDINARY_APIKEY,
            cloud_name: process.env.CLOUDINARY_CLOUD,
            folder,
            type: 'private',
          })
        })
      },
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
