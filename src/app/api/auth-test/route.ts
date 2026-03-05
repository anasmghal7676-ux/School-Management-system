import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test 1: DB connection
    const userCount = await db.user.count()
    
    // Test 2: Find admin user (no sensitive data)
    const admin = await db.user.findFirst({
      where: { username: 'admin' },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        passwordHash: true, // just first 10 chars to confirm it's bcrypt
        role: { select: { name: true, level: true } }
      }
    })

    return NextResponse.json({
      dbConnected: true,
      totalUsers: userCount,
      adminFound: !!admin,
      adminActive: admin?.isActive,
      adminLocked: admin?.lockedUntil ? admin.lockedUntil > new Date() : false,
      failedAttempts: admin?.failedLoginAttempts,
      hashPrefix: admin?.passwordHash?.substring(0, 10),
      role: admin?.role?.name,
      roleLevel: admin?.role?.level,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    })
  } catch (err: any) {
    return NextResponse.json({
      dbConnected: false,
      error: err.message,
      hasDbUrl: !!process.env.DATABASE_URL,
    }, { status: 500 })
  }
}
