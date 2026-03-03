/**
 * API Route Auth Helpers
 * Used inside Next.js route handlers to check permissions
 * Works with headers injected by middleware
 */
import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, hasLevel } from './rbac'

export interface AuthContext {
  userId:      string
  roleName:    string
  roleLevel:   number
  permissions: string[]
  schoolId:    string
  isStaff:     boolean
}

/**
 * Extract auth context from request headers (injected by middleware)
 */
export function getAuthContext(req: NextRequest): AuthContext {
  const permissionsHeader = req.headers.get('x-user-permissions')
  const permissions = permissionsHeader ? JSON.parse(permissionsHeader) : []

  return {
    userId:      req.headers.get('x-user-id')    || '',
    roleName:    req.headers.get('x-user-role')  || 'Parent',
    roleLevel:   Number(req.headers.get('x-user-level') || 1),
    permissions,
    schoolId:    req.headers.get('x-school-id')  || '',
    isStaff:     req.headers.get('x-is-staff') === 'true',
  }
}

/**
 * Require minimum role level — returns 403 response if not met
 */
export function requireLevel(
  auth: AuthContext,
  minLevel: number,
  message?: string
): NextResponse | null {
  if (!hasLevel(auth.roleLevel, minLevel)) {
    return NextResponse.json(
      {
        success: false,
        error: message || `Access denied — requires level ${minLevel}+`,
        code: 'INSUFFICIENT_LEVEL',
        required: minLevel,
        current: auth.roleLevel,
      },
      { status: 403 }
    )
  }
  return null
}

/**
 * Require specific permission — returns 403 response if missing
 */
export function requirePermission(
  auth: AuthContext,
  permission: string,
  message?: string
): NextResponse | null {
  if (!hasPermission(auth.permissions, permission)) {
    return NextResponse.json(
      {
        success: false,
        error: message || `Access denied — missing permission: ${permission}`,
        code: 'PERMISSION_DENIED',
        required: permission,
      },
      { status: 403 }
    )
  }
  return null
}

/**
 * Combined check — level OR permission (whichever is applicable)
 * Returns error response if denied, null if allowed
 */
export function requireAccess(
  auth: AuthContext,
  options: { minLevel?: number; permission?: string; message?: string }
): NextResponse | null {
  if (options.minLevel && !hasLevel(auth.roleLevel, options.minLevel)) {
    return NextResponse.json(
      {
        success: false,
        error: options.message || `Requires access level ${options.minLevel}+`,
        code: 'INSUFFICIENT_LEVEL',
      },
      { status: 403 }
    )
  }
  if (options.permission && !hasPermission(auth.permissions, options.permission)) {
    return NextResponse.json(
      {
        success: false,
        error: options.message || `Missing permission: ${options.permission}`,
        code: 'PERMISSION_DENIED',
      },
      { status: 403 }
    )
  }
  return null
}

/**
 * Helper: returns true if user can manage (create/edit/delete) a resource
 */
export function canManage(auth: AuthContext, resource: string): boolean {
  return (
    hasPermission(auth.permissions, `${resource}:edit`) ||
    hasPermission(auth.permissions, `${resource}:*`) ||
    hasPermission(auth.permissions, '*:*')
  )
}

/**
 * Helper: restrict data to own school
 */
export function schoolFilter(auth: AuthContext): { schoolId?: string } {
  // Super admins can see all schools
  if (auth.roleLevel >= 10) return {}
  // Others filtered to their school
  if (auth.schoolId) return { schoolId: auth.schoolId }
  return {}
}

// Legacy compatibility export
export const ROLE_LEVELS = {
  SUPER_ADMIN:    10,
  PRINCIPAL:      9,
  VICE_PRINCIPAL: 8,
  ADMINISTRATOR:  7,
  ACCOUNTANT:     6,
  COORDINATOR:    5,
  TEACHER:        4,
  LIBRARIAN:      3,
  RECEPTIONIST:   2,
  PARENT:         1,
} as const
