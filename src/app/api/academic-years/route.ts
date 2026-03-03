import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAccess, ROLE_LEVELS } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const schoolId  = sp.get('schoolId');
    const current   = sp.get('current');

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (current === 'true') where.isCurrent = true;

    const years = await db.academicYear.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { feeStructures: true, exams: true } } },
    });
    return NextResponse.json({ success: true, data: years });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch academic years' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const _denied = requireAccess(getAuthContext(request), {minLevel: ROLE_LEVELS.PRINCIPAL});
  if (_denied) return _denied;

  try {
    const body = await request.json();
    const { schoolId, name, startDate, endDate, isCurrent } = body;
    if (!schoolId || !name || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: 'schoolId, name, startDate, endDate required' }, { status: 400 });
    }
    // If setting as current, unset previous
    if (isCurrent) {
      await db.academicYear.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
    }
    const year = await db.academicYear.create({
      data: { schoolId, name, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent: isCurrent || false },
    });
    return NextResponse.json({ success: true, data: year }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create academic year' }, { status: 500 });
  }
}
