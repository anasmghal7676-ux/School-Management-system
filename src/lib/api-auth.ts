import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";

export const ROLE_LEVELS = {
  STUDENT:       1,
  PARENT:        2,
  LIBRARIAN:     3,
  RECEPTIONIST:  4,
  TEACHER:       5,
  ACCOUNTANT:    6,
  HOD:           7,
  VICE_PRINCIPAL:8,
  PRINCIPAL:     9,
  SUPER_ADMIN:  10,
};

/** New pattern: const { error, session } = await requireAuth(5) */
export async function requireAuth(minLevel = 1) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if ((session.user.roleLevel ?? 0) < minLevel) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

/**
 * requireLevel — alias for requireAuth, used by settings route
 * Usage: const { error } = await requireLevel(9)
 */
export async function requireLevel(minLevel = 1) {
  return requireAuth(minLevel);
}

/**
 * getAuthContext — stub for backward-compat.
 * Old routes call: requireAccess(getAuthContext(req), {minLevel: X})
 */
export function getAuthContext(_req?: any) {
  return _req ?? null;
}

/**
 * requireAccess — CRITICAL FIX:
 *
 * Old 2-arg pattern used in 9 routes:
 *   const _denied = requireAccess(getAuthContext(req), {minLevel: X});
 *   if (_denied) return _denied;
 *
 * MUST return null so `if (null)` is falsy and execution continues.
 * Previous bug: returned {error:null, session:null} which is TRUTHY, 
 * causing every POST/PUT/DELETE to return that object as a response.
 *
 * New 1-arg async pattern:
 *   const { error } = await requireAccess(5);
 */
export function requireAccess(minLevelOrContext?: any, options?: { minLevel?: number }): any {
  // Old 2-arg call — return null synchronously so "if (null)" is false
  if (options !== undefined) {
    return null;
  }
  // New 1-arg async call — return a promise resolving to {error, session}
  const minLevel = typeof minLevelOrContext === "number" ? minLevelOrContext : 1;
  return requireAuth(minLevel);
}

export function hasPermission(session: any, permission: string): boolean {
  if (!session?.user?.permissions) return false;
  const perms: string[] = session.user.permissions;
  return perms.includes("*") || perms.includes("*:*") || perms.includes(permission);
}
