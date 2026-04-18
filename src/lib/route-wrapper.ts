import { requireAuth, ROLE_LEVELS, type AuthContext } from './api-auth';
import { NextRequest, NextResponse } from 'next/server';

type Handler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

/**
 * Wraps a route handler with authentication + optional minimum role level.
 *
 * Usage:
 *   export const GET = protectedRoute(async (req, ctx) => {
 *     // ctx.id, ctx.role, ctx.schoolId all guaranteed
 *   }, 'Accountant');
 */
export function protectedRoute(handler: Handler, minRole?: string) {
  return async (req: NextRequest) => {
    const { error, ctx } = await requireAuth();
    if (error) return error;

    if (minRole) {
      const userLevel = ROLE_LEVELS[ctx.role] ?? 0;
      const required  = ROLE_LEVELS[minRole]  ?? 0;
      if (userLevel < required) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    return handler(req, ctx);
  };
}
