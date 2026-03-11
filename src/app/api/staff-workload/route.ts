export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const departmentId = sp.get('departmentId') || '';
    const where: any = { status: 'active' };
    if (departmentId) where.departmentId = departmentId;
    const staff = await db.staff.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        timetable: { include: { section: { include: { class: true } }, slot: true } },
      },
      orderBy: { firstName: 'asc' },
    });
    const data = staff.map(s => ({
      ...s,
      weeklyHours: s.timetable.length,
      approvedLeaves: 0,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
