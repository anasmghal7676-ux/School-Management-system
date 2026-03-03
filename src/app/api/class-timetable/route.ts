import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'timetable_';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
async function getTimetable(classId: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: KEY + classId + '_' } } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    if (!classId) return NextResponse.json({ classes, periods: [] });
    const periods = await getTimetable(classId);
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    const staff = await prisma.staff.findMany({ where: { status: 'Active', role: 'Teacher' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    return NextResponse.json({ classes, periods, subjects, staff, days: DAYS });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json(); // { classId, day, period, subjectId, subjectName, teacherId, teacherName, startTime, endTime, room }
    const key = `${KEY}${body.classId}_${body.day}_${body.period}`;
    const item = { ...body, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(item) }, update: { value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { classId, day, period } = await req.json();
    const key = `${KEY}${classId}_${day}_${period}`;
    await prisma.systemSetting.deleteMany({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
