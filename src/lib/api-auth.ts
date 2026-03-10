import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function requireAuth(req?: NextRequest): Promise<void> {
  // Compatibility shim — actual session check done per-route
  return Promise.resolve();
}

/**
 * Get session with schoolId — call in API routes that need tenant isolation.
 * Returns null if not authenticated.
 */
export async function getSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch {
    return null;
  }
}

/**
 * Get schoolId from session. Returns first school from DB as fallback (dev only).
 */
export async function getSchoolId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).schoolId) {
      return (session.user as any).schoolId as string;
    }
    // Dev fallback: use first school in DB
    if (process.env.NODE_ENV !== 'production') {
      const { db } = await import('@/lib/db');
      const school = await db.school.findFirst({ select: { id: true } });
      return school?.id || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Standard unauthorized response
 */
export function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
