import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { NextRequest, NextResponse } from 'next/server';

// ─── Core Auth Context ────────────────────────────────────────────────────────

export type AuthContext = {
  id: string;
  email: string;
  name?: string;
  role: string;
  schoolId: string;
  username?: string;
};

/**
 * Returns the authenticated user context from the NextAuth JWT session.
 * Accepts optional req for backward compat (ignored — NextAuth reads cookies).
 */
export async function getAuthContext(_req?: NextRequest): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? undefined,
    role: user.role ?? 'Teacher',
    schoolId: user.schoolId ?? 'school_main',
    username: user.username ?? undefined,
  };
}

/** Alias kept for backward compat */
export async function getSession(_req?: NextRequest): Promise<AuthContext | null> {
  return getAuthContext();
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

/**
 * Returns { error: NextResponse, ctx: null } if unauthenticated,
 * or { error: null, ctx: AuthContext } if authenticated.
 * Accepts optional req for backward compat.
 */
export async function requireAuth(_req?: NextRequest): Promise<
  | { error: NextResponse; ctx: null; session: null }
  | { error: null; ctx: AuthContext; session: AuthContext }
> {
  const ctx = await getAuthContext();
  if (!ctx) {
    const error = NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'NO_SESSION' },
      { status: 401 }
    );
    return { error, ctx: null, session: null };
  }
  return { error: null, ctx, session: ctx };
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

export const ROLE_LEVELS: Record<string, number> = {
  'Super Admin': 10,
  'Principal': 9,
  'Vice Principal': 8,
  'Administrator': 7,
  'Accountant': 6,
  'Coordinator': 5,
  'Teacher': 4,
  'Librarian': 3,
  'Receptionist': 2,
  'Parent': 1,
  // Legacy lowercase keys
  super_admin: 10,
  principal: 9,
  vice_principal: 8,
  hod: 7,
  accountant: 6,
  teacher: 5,
  receptionist: 4,
  parent: 2,
};

type AccessOptions = string | { minLevel?: number; permission?: string };

/**
 * requireAccess — supports both string permission and { minLevel, permission } object.
 * Also accepts Promise<AuthContext | null> for legacy routes that forgot to await getAuthContext.
 * Returns a NextResponse (403) if access is denied, or null if allowed.
 */
export function requireAccess(
  ctx: AuthContext | null | Promise<AuthContext | null>,
  options?: AccessOptions
): NextResponse | null {
  // If ctx is a Promise (caller forgot await), treat as unauthenticated
  if (!ctx || ctx instanceof Promise) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'NO_SESSION' },
      { status: 401 }
    );
  }

  const highRoles = ['Super Admin', 'Principal'];
  // High-level roles bypass all permission checks
  if (highRoles.includes(ctx.role)) return null;

  if (options) {
    if (typeof options === 'string') {
      // String permission check — placeholder, always allow for now
      return null;
    }
    if (typeof options === 'object' && options.minLevel !== undefined) {
      const userLevel = ROLE_LEVELS[ctx.role] ?? 0;
      if (userLevel < options.minLevel) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }
  }

  return null;
}

export function requireLevel(
  ctx: AuthContext | null | Promise<AuthContext | null>,
  level: number
): boolean {
  if (!ctx || ctx instanceof Promise) return false;
  return (ROLE_LEVELS[ctx.role] ?? 0) >= level;
}

export function forbidden(message = 'Insufficient permissions'): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}
