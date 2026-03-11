export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'hostel_att_entry_';
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const roomFilter = searchParams.get('room') || '';
    const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: `${KEY}${date}_` } } });
    let records = s.map((x: any) => JSON.parse(x.settingValue));
    if (roomFilter) records = records.filter((r: any) => r.room === roomFilter);
    const hostelStudents = await db.student.findMany({ where: { hostelId: { not: null } }, include: { class: true }, orderBy: { fullName: 'asc' } });
    const rooms = [...new Set(hostelStudents.map((s: any) => s.hostelRoomNumber).filter(Boolean))];
    const markedIds = new Set(records.map((r: any) => r.studentId));
    const attendanceMap: Record<string, any> = {};
    records.forEach((r: any) => { attendanceMap[r.studentId] = r; });
    const summary = { present: records.filter((r: any) => r.status === 'Present').length, absent: records.filter((r: any) => r.status === 'Absent').length, leave: records.filter((r: any) => r.status === 'Leave').length, total: hostelStudents.length };
    return NextResponse.json({ records, hostelStudents, rooms, markedIds: Array.from(markedIds), attendanceMap, summary, date });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { date, entries } = await req.json();
    for (const entry of entries) {
      const key = `${KEY}${date}_${entry.studentId}`;
      const val = JSON.stringify({ ...entry, date, markedAt: new Date().toISOString() });
      await db.systemSetting.upsert({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: key } }, create: { settingKey: key, settingValue: val, schoolId: 'school_main', settingType: 'General' }, update: { settingValue: val } });
    }
    return NextResponse.json({ ok: true, count: entries.length });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
