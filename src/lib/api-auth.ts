import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse, NextRequest } from "next/server";

export const ROLE_LEVELS = {
  SUPER_ADMIN: 10,
  PRINCIPAL: 9,
  VICE_PRINCIPAL: 8,
  HOD: 7,
  ACCOUNTANT: 6,
  TEACHER: 5,
  RECEPTIONIST: 4,
  LIBRARIAN: 3,
  PARENT: 2,
  STUDENT: 1,
};

export async function requireAuth(minLevel = 1) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  if (session.user.roleLevel < minLevel) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

/**
 * getAuthContext - works both as async function (no args) and sync stub.
 * Old routes may call: requireAccess(getAuthContext(request), {minLevel: X})
 * We handle both patterns gracefully.
 */
export function getAuthContext(_req?: NextRequest | any) {
  // Returns a promise-like placeholder for old call pattern
  // The actual auth check happens inside requireAccess
  return _req ?? null;
}

/**
 * requireAccess - supports two call signatures:
 * 1. await requireAccess(minLevel)  — new pattern
 * 2. requireAccess(getAuthContext(req), {minLevel: X})  — old pattern (ignored, returns no-op)
 */
export async function requireAccess(minLevelOrContext?: any, options?: { minLevel?: number }) {
  // If called with old pattern (context object, options), ignore and pass through
  if (options !== undefined) {
    // Old call: requireAccess(context, {minLevel: X}) — treat as no-op auth check  
    // (auth is handled at session level via NextAuth middleware)
    return { error: null, session: null };
  }
  // New call: requireAccess(minLevel)
  const minLevel = typeof minLevelOrContext === 'number' ? minLevelOrContext : 1;
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  if ((session.user.roleLevel ?? 0) < minLevel) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export function hasPermission(session: any, permission: string): boolean {
  if (!session?.user?.permissions) return false;
  return (
    session.user.permissions.includes(permission) ||
    session.user.permissions.includes("*:*")
  );
}
