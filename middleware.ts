import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname === '/setup') return NextResponse.next();
    if (token?.role === 'super_admin') return NextResponse.next();

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/setup') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/setup') ||
          pathname === '/'
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
