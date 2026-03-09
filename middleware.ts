import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Add a new header x-current-path which passes the path to downstream components
  const response = NextResponse.next()
  response.headers.append('x-current-path', request.nextUrl.pathname)

  return response
}

export const config = {
  matcher: [
    // match all routes except static files and APIs
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
