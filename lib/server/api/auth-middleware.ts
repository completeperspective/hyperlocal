import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest } from 'next/server'
import { getSession } from '@/server/auth'

export async function authMiddleware(req: NextRequest) {
  // Do not require authentication for public endpoints
  if (isPublicPath(req)) return

  // Require authentication for all other endpoints
  const session = await getSession()
  if (!session?.data) {
    throw new ApiError(401, 'Unauthorized')
  }

  // Require admin authorization for admin endpoints
  if (isAdminPath(req)) {
    if (!session?.data.isAdmin) {
      throw new ApiError(403, 'Forbidden')
    }
  }
}

function isPublicPath(req: NextRequest) {
  const publicPaths = ['POST:/api/v1/auth/login', 'DELETE:/api/v1/auth/logout']
  return publicPaths.includes(`${req.method}:${req.nextUrl.pathname}`)
}

function isAdminPath(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  return pathname.includes('/admin/')
}
