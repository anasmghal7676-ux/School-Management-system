export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getAuthContext, requireAccess } from '@/lib/api-auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 7 })
    if (denied) return denied

    const { password } = await req.json()
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be 6+ characters' }, { status: 400 })
    }

    await db.user.update({
      where: { id: (await params).id },
      data: {
        passwordHash:         await hash(password, 12),
        failedLoginAttempts:  0,
        lockedUntil:          null,
      },
    })
    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
