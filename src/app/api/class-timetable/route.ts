export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'timetable_';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
async function getTimetable(classId: string) {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY + classId + '_' } } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    if (!classId) return NextResponse.json({ classes, periods: [] });
    const periods = await getTimetable(classId);
    const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'active', designation: { contains: 'Teacher', mode: 'insensitive' } }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    return NextResponse.json({ classes, periods, subjects, staff, days: DAYS });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json(); // { classId, day, period, subjectId, subjectName, teacherId, teacherName, startTime, endTime, room }
    const key = `${KEY}${body.classId}_${body.day}_${body.period}`;
    const item = { ...body, updatedAt: new Date().toISOString() };
    await db.systemSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(item) }, update: { value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { classId, day, period } = await req.json();
    const key = `${KEY}${classId}_${day}_${period}`;
    await db.systemSetting.deleteMany({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
