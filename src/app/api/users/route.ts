export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getAuthContext, requireAccess } from '@/lib/api-auth'
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 7 })
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const roleId = searchParams.get('roleId') || ''
    const page   = parseInt(searchParams.get('page') || '1')
    const limit  = 50

    const where: any = {}
    if (search) {
      where.OR = [
        { username:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
      ]
    }
    if (roleId) where.roleId = roleId

    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        include: { role: { select: { id: true, name: true, level: true } } },
        orderBy: [{ role: { level: 'desc' } }, { username: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    // Omit password hashes
    const sanitized = items.map(u => {
      const { passwordHash: _, ...rest } = u as any
      return rest
    })

    return NextResponse.json({ success: true, data: { items: sanitized, total, page } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req)
    const denied = requireAccess(auth, { minLevel: 7 })
    if (denied) return denied

    const body = await req.json()

  const _parsed = UserCreateSchema.safeParse(body)
  if (!_parsed.success) {
    return NextResponse.json({
      success: false, error: 'Validation failed',
      details: _parsed.error.flatten().fieldErrors,
    }, { status: 400 })
  }
    const { username, email, firstName, lastName, roleId, password, isActive, isStaff } = body

    if (!username || !email || !roleId || !password) {
      return NextResponse.json({ success: false, error: 'username, email, roleId, and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check uniqueness
    const existing = await db.user.findFirst({ where: { OR: [{ username }, { email }] } })
    if (existing) {
      return NextResponse.json({ success: false, error: `${existing.username === username ? 'Username' : 'Email'} already exists` }, { status: 409 })
    }

    const passwordHash = await hash(password, 12)
    const user = await db.user.create({
      data: { username, email, firstName: firstName || '', lastName: lastName || '', roleId, passwordHash, isActive: isActive !== false, isStaff: isStaff || false },
      include: { role: { select: { id: true, name: true, level: true } } },
    })

    const { passwordHash: _, ...sanitized } = user as any
    return NextResponse.json({ success: true, data: sanitized }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
