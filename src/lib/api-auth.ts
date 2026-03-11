import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export type AuthSession = {
  userId: string;
  schoolId: string;
  role: string;
  email: string;
};

/**
 * Validate session and return auth info, or throw with a NextResponse error.
 * Usage: const auth = await requireAuth(); // throws NextResponse on failure
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw Object.assign(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      { isAuthError: true }
    );
  }
  const user = session.user as any;
  return {
    userId: user.id,
    schoolId: user.schoolId || 'school_main',
    role: user.role || 'viewer',
    email: user.email || '',
  };
}

export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

export async function getSchoolId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (session?.user && (session.user as any).schoolId) {
    return (session.user as any).schoolId as string;
  }
  return 'school_main';
}

// Compatibility aliases for routes using legacy API
export const getAuthContext = getSession;

export async function requireAccess(_req?: NextRequest, _roles?: string[]): Promise<void> {
  // Middleware handles auth; this is a no-op compatibility shim
}

export const ROLE_LEVELS: Record<string, number> = {
  super_admin: 10,
  principal: 9,
  vice_principal: 8,
  administrator: 7,
  accountant: 6,
  coordinator: 5,
  teacher: 4,
  librarian: 3,
  parent: 2,
  student: 1,
};
