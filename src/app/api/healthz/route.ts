import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, any> = {
    ts: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      dbPrefix: process.env.DATABASE_URL?.slice(0, 50),
    }
  }
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    const user = await prisma.user.findFirst({
      where: { username: 'admin' },
      select: { id: true, username: true, isActive: true, failedLoginAttempts: true, lockedUntil: true, passwordHash: true }
    })
    checks.db = 'connected'
    checks.adminUser = user ? {
      found: true,
      username: user.username,
      isActive: user.isActive,
      failedAttempts: user.failedLoginAttempts,
      locked: user.lockedUntil ? user.lockedUntil > new Date() : false,
      hashPrefix: user.passwordHash?.slice(0, 10)
    } : { found: false }
    await prisma.$disconnect()
  } catch (e: any) {
    checks.db = 'ERROR'
    checks.dbError = e.message
  }
  return NextResponse.json(checks)
}
