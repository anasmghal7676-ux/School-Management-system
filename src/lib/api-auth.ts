import type { NextRequest } from 'next/server';

// Authentication disabled - all requests allowed
// Will be re-enabled in a future session

export function requireAuth(_req: NextRequest) {
  return null; // null = allowed
}

export function requireAccess(_req: NextRequest, _opts?: any) {
  return null; // null = allowed
}

export function requireLevel(_req: NextRequest, _level?: number) {
  return null; // null = allowed
}

export async function getAuthContext(_req: NextRequest) {
  return {
    session: null,
    user: null,
    role: 'super_admin',
    level: 10,
    permissions: ['*'],
  };
}

export const ROLE_LEVELS = {
  super_admin: 10,
  admin: 8,
  principal: 7,
  teacher: 5,
  staff: 3,
  parent: 2,
  student: 1,
};

export function hasPermission(_permissions: string[], _required: string) {
  return true; // all allowed
}
