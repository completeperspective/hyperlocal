import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from './auth-middleware'

// Reason: Next.js 15 App Router passes { params: Promise<unknown> } as the second
// arg to route handlers. Using `unknown` keeps this type-safe while remaining
// assignable from handlers that ignore the context entirely.
type RouteHandler = (
  req: NextRequest,
  ctx?: { params?: Promise<unknown> },
) => Promise<NextResponse> | NextResponse

export const apiHandler =
  (...handlers: RouteHandler[]) =>
  async (req: NextRequest, ctx: { params: Promise<unknown> }) => {
    try {
      // Stack middlewares here
      await authMiddleware(req)

      for (const handler of handlers) {
        return await handler(req, ctx)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(error.message)
        return NextResponse.json(
          { message: error.message },
          { status: error.statusCode },
        )
      } else {
        console.error('Internal Server Error:', error)
        return NextResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 },
        )
      }
    }
  }
