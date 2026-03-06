import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Always allow auth pages and API routes
        if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
          return true;
        }
        // Require auth for everything else
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|public).*)",
  ],
};
