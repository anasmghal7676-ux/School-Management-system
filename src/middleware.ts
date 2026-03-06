import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: auth pages, API auth, static files
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Check token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
  ],
};
