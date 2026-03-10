import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  const publicPaths = ['/login', '/api/auth', '/_next', '/favicon', '/public', '/onboard'];
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon|public|onboard).*)'],
};
