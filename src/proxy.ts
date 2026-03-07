import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ??
  "QAsU4y0QYrqaTMA07iPOXQfD2kHZmSHBfcLuOZ3sDVw=";

// Next.js 16: proxy.ts must export 'proxy' (not 'middleware')
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass through static assets + auth API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Setup + auth pages — always pass through
  if (pathname.startsWith("/setup") || pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // API routes — let route handlers do auth
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // All other pages — require valid JWT
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)"],
};
