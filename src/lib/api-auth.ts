import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";

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

/** Alias used by many existing API routes */
export async function getAuthContext() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

/** Alias used by many existing API routes */
export async function requireAccess(minLevel = 1) {
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
