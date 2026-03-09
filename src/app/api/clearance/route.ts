export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const where: any = {};
    if (classId) where.currentClassId = classId;
    const students = await db.student.findMany({ where, include: { class: true, section: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: students });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
