import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { username, password } = body
  const result: Record<string, any> = { step: 'start' }

  try {
    result.step = 'checking-env'
    result.hasDbUrl = !!process.env.DATABASE_URL
    result.hasSecret = !!process.env.NEXTAUTH_SECRET
    result.dbUrlStart = process.env.DATABASE_URL?.slice(0, 55)

    result.step = 'importing-prisma'
    const { db } = await import('@/lib/db')

    result.step = 'querying-user'
    const user = await db.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
      include: { role: true }
    })

    result.step = 'user-found'
    result.userFound = !!user
    result.userActive = user?.isActive
    result.userLocked = user?.lockedUntil ? user.lockedUntil > new Date() : false
    result.hashPrefix = user?.passwordHash?.slice(0, 10)
    result.roleFound = !!user?.role
    result.roleName = user?.role?.name

    if (user && password) {
      result.step = 'comparing-password'
      const match = await compare(password, user.passwordHash)
      result.passwordMatch = match
    }

    result.step = 'done'
  } catch (e: any) {
    result.error = e.message
    result.code = e.code
    result.step = 'ERROR at: ' + result.step
  }

  return NextResponse.json(result)
}
