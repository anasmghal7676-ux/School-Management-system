import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass through: static assets, auth API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Setup page — only block if already set up (checked client-side on the page)
  if (pathname.startsWith("/setup")) {
    return NextResponse.next();
  }

  // Auth pages — pass through always
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // API routes (non-auth) — pass through, let route handlers do auth
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // All other pages — require auth token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

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
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
  ],
};
