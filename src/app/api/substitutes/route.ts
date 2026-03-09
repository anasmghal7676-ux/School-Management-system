export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const items = await db.substitution.findMany({ include: { absentTeacher: true, substituteTeacher: true, class: true, subject: true }, orderBy: { date: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: items });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.absentTeacherId || !body.substituteTeacherId || !body.classId || !body.date) return NextResponse.json({ success: false, error: 'Required fields missing' }, { status: 400 });
    const item = await db.substitution.create({ data: { absentTeacherId: body.absentTeacherId, substituteTeacherId: body.substituteTeacherId, classId: body.classId, date: new Date(body.date), reason: body.reason || null, subjectId: body.subjectId || null, period: body.period || null } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
