import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAccess, ROLE_LEVELS } from '@/lib/api-auth';
import { db } from '@/lib/db';

// GET /api/fee-types - List all fee types
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const schoolId = sp.get('schoolId');
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;

    const feeTypes = await db.feeType.findMany({
      where,
      include: { _count: { select: { feeStructures: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: feeTypes });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch fee types' }, { status: 500 });
  }
}

// POST /api/fee-types - Create fee type
export async function POST(request: NextRequest) {
    const _denied = requireAccess(getAuthContext(request), {minLevel: ROLE_LEVELS.PRINCIPAL});
  if (_denied) return _denied;

  try {
    const body = await request.json();
    const { name, code, description, schoolId } = body;
    if (!name || !code) {
      return NextResponse.json({ success: false, message: 'name and code are required' }, { status: 400 });
    }
    const ft = await db.feeType.create({
      data: { name, code, description: description || null, schoolId: schoolId || null },
    });
    return NextResponse.json({ success: true, data: ft }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, message: 'Fee type code already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: 'Failed to create fee type' }, { status: 500 });
  }
}
