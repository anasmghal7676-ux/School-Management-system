import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { canAccessRoute, getMinLevelForMethod, hasPermission } from '@/lib/rbac'

// ─── PUBLIC PATHS (no auth required) ─────────────────────────────────────────
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/error',
  '/auth/forgot-password',
  '/api/auth',
  '/api/health',
  '/api/setup',      // initial setup endpoint
]

// ─── STATIC FILE PATTERNS ─────────────────────────────────────────────────────
const STATIC_PATTERNS = [
  '/_next/',
  '/favicon',
  '/icons/',
  '/images/',
  '/fonts/',
]

export async function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl as any
  const reqMethod = request.method

  // ── Skip static files ────────────────────────────────────────────────────
  if (
    STATIC_PATTERNS.some(p => pathname.startsWith(p)) ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // ── Allow public paths ────────────────────────────────────────────────────
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Verify JWT token ──────────────────────────────────────────────────────
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
  })

  // ── No token — redirect or 401 ────────────────────────────────────────────
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized — please log in', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Extract user context from token ──────────────────────────────────────
  const userLevel       = Number((token.role as any)?.level || 1)
  const roleName        = String((token.role as any)?.name || 'Parent')
  const userPermissions: string[] = (token.role as any)?.permissions || []
  const userId          = String(token.id || token.sub || '')

  // ── RBAC check for API routes ─────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Check minimum level for destructive operations
    const minLevelForMethod = getMinLevelForMethod(pathname, reqMethod)
    if (minLevelForMethod > 0 && userLevel < minLevelForMethod) {
      return NextResponse.json(
        {
          success: false,
          error: `Access denied — ${reqMethod} operations require level ${minLevelForMethod}+. Your level: ${userLevel}`,
          code: 'INSUFFICIENT_LEVEL',
          required: minLevelForMethod,
          current: userLevel,
        },
        { status: 403 }
      )
    }

    // Check route-specific permissions
    const { allowed, reason } = canAccessRoute(pathname, reqMethod, userLevel, userPermissions)
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Access denied — ${reason}`,
          code: 'PERMISSION_DENIED',
        },
        { status: 403 }
      )
    }

    // ── Inject user context headers for API handlers ───────────────────────
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id',          userId)
    requestHeaders.set('x-user-role',        roleName)
    requestHeaders.set('x-user-level',       String(userLevel))
    requestHeaders.set('x-user-permissions', JSON.stringify(userPermissions))
    requestHeaders.set('x-school-id',        String(token.schoolId || ''))
    requestHeaders.set('x-is-staff',         String((token as any).isStaff || false))

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── Page-level access check ────────────────────────────────────────────────
  // High-privilege pages check
  const restrictedPages: { path: string; minLevel: number; label: string }[] = [
    { path: '/users',             minLevel: 7,  label: 'User Management' },
    { path: '/roles',             minLevel: 9,  label: 'Role Management' },
    { path: '/settings',          minLevel: 7,  label: 'Settings' },
    { path: '/payroll',           minLevel: 6,  label: 'Payroll' },
    { path: '/salary-slips',      minLevel: 6,  label: 'Salary Slips' },
    { path: '/fin-reports', minLevel: 6,  label: 'Financial Reports' },
    { path: '/teacher-perf', minLevel: 5, label: 'Teacher Performance' },
  ]

  for (const { path, minLevel, label } of restrictedPages) {
    if (pathname.startsWith(path) && userLevel < minLevel) {
      const url = new URL('/unauthorized', request.url)
      url.searchParams.set('page', label)
      url.searchParams.set('required', String(minLevel))
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
