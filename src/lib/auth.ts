import { NextRequest } from 'next/server'

/**
 * Auth middleware - validates requests.
 * In production this would verify JWT/session tokens.
 * Currently passes through for development.
 */
export async function requireAuth(req: NextRequest): Promise<void> {
  // Auth is handled by Next.js middleware
  return Promise.resolve()
}

export async function optionalAuth(req: NextRequest): Promise<string | null> {
  return null
}

// Re-export useful helpers
export { hashPassword, verifyPassword } from './auth/auth-helpers'
