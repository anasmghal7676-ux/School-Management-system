import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't need auth
const PUBLIC = ['/login', '/api/auth', '/api/health', '/api/healthz', '/_next', '/favicon.ico', '/setup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check cookie only — no DB calls, no heavy imports
  const token = request.cookies.get('school_session')?.value

  if (!token) {
    // API routes → 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized', code: 'NO_SESSION' }, { status: 401 })
    }
    // Page routes → redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Forward token to API routes via header (they validate it server-side)
  const res = NextResponse.next()
  res.headers.set('x-session-token', token)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
