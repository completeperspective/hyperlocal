import { ApiError } from 'next/dist/server/api-utils'
import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from './auth-middleware'

export const apiHandler =
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  (...handelrs: Function[]) =>
    async (req: NextRequest, res: NextResponse) => {
      try {
        // Stack middlewares here
        await authMiddleware(req)

        for (const handler of handelrs) {
          return await handler(req, res)
        }
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(error.message)
          return NextResponse.json(
            {
              message: error.message,
            },
            {
              status: error.statusCode,
            },
          )
        } else {
          console.error('Internal Server Error:', error)
          return NextResponse.json(
            {
              message: 'Internal Server Error',
            },
            {
              status: 500,
            },
          )
        }
      }
    }
