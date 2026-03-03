import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, requireAccess } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const roles = await db.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { level: 'desc' },
    })
    return NextResponse.json({ success: true, data: roles })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 9 })
    if (denied) return denied

    const { name, description, level, permissions } = await req.json()
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 })

    const role = await db.role.create({
      data: { name, description: description || '', level: level || 4, permissions: permissions || '[]' },
    })
    return NextResponse.json({ success: true, data: role }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
