export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getAuthContext, requireAccess } from '@/lib/api-auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 7 })
    if (denied) return denied

    const user = await db.user.findUnique({
      where: { id: (await params).id },
      include: { role: { select: { id: true, name: true, level: true, permissions: true } } },
    })
    if (!user) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const { passwordHash: _, ...sanitized } = user as any
    return NextResponse.json({ success: true, data: sanitized })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 7 })
    if (denied) return denied

    const body = await req.json()
    const { password, ...rest } = body

    const updateData: any = {}
    if (rest.username   !== undefined) updateData.username   = rest.username
    if (rest.email      !== undefined) updateData.email      = rest.email
    if (rest.firstName  !== undefined) updateData.firstName  = rest.firstName
    if (rest.lastName   !== undefined) updateData.lastName   = rest.lastName
    if (rest.roleId     !== undefined) updateData.roleId     = rest.roleId
    if (rest.isActive   !== undefined) updateData.isActive   = rest.isActive
    if (rest.isStaff    !== undefined) updateData.isStaff    = rest.isStaff
    if (password) updateData.passwordHash = await hash(password, 12)

    const user = await db.user.update({
      where: { id: (await params).id },
      data: updateData,
      include: { role: { select: { id: true, name: true, level: true } } },
    })
    const { passwordHash: _, ...sanitized } = user as any
    return NextResponse.json({ success: true, data: sanitized })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 9 }) // Only principal+ can delete users
    if (denied) return denied

    // Prevent self-deletion
    if (auth?.id === (await params).id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })
    }

    await db.user.delete({ where: { id: (await params).id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
