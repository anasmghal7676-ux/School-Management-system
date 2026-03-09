export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const where: any = {};
    if (studentId) where.studentId = studentId;
    const achievements = await db.certificate.findMany({ where, include: { student: true }, orderBy: { issuedDate: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: achievements });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.studentId || !body.title) return NextResponse.json({ success: false, error: 'studentId and title required' }, { status: 400 });
    const item = await db.certificate.create({ data: { studentId: body.studentId, title: body.title, type: body.type || 'Achievement', issuedDate: body.issuedDate ? new Date(body.issuedDate) : new Date(), description: body.description || null, certificateNumber: `ACH-${Date.now()}`, schoolId: 'school_main' } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
