export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, requireAccess } from '@/lib/api-auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 9 })
    if (denied) return denied

    const body = await req.json()
    const role = await db.role.update({
      where: { id: (await params).id },
      data: {
        name:        body.name,
        description: body.description,
        level:       body.level,
        permissions: body.permissions,
      },
    })
    return NextResponse.json({ success: true, data: role })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 10 })  // Only super admin can delete roles
    if (denied) return denied

    // Check if any users have this role
    const userCount = await db.user.count({ where: { roleId: (await params).id } })
    if (userCount > 0) {
      return NextResponse.json({ success: false, error: `Cannot delete role with ${userCount} active user(s)` }, { status: 400 })
    }

    await db.role.delete({ where: { id: (await params).id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
