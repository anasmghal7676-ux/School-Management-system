export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const current = await db.academicYear.findFirst({ where: { isCurrent: true } });
    const all = await db.academicYear.findMany({ orderBy: { startDate: 'desc' } });
    return NextResponse.json({ success: true, data: all, current });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.startDate || !body.endDate) return NextResponse.json({ success: false, error: 'name, startDate, endDate required' }, { status: 400 });
    if (body.isCurrent) await db.academicYear.updateMany({ data: { isCurrent: false } });
    const item = await db.academicYear.create({ data: { name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate), isCurrent: body.isCurrent ?? false, schoolId: body.schoolId || 'school_main' } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
