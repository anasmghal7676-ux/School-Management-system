export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const HALL_KEY = 'exam_hall_';
const SEAT_KEY = 'exam_seat_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'halls';
    const examId = searchParams.get('examId') || '';
    const hallId = searchParams.get('hallId') || '';
    const halls = await getByPrefix(HALL_KEY);
    if (view === 'seating') {
      let seats = await getByPrefix(SEAT_KEY);
      if (examId) seats = seats.filter((s: any) => s.examId === examId);
      if (hallId) seats = seats.filter((s: any) => s.hallId === hallId);
      seats.sort((a: any, b: any) => (a.seatNumber || '').localeCompare(b.seatNumber || ''));
      const exams = await db.exam.findMany({ orderBy: { startDate: 'desc' }, take: 20 });
      const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
      const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, currentClassId: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
      return NextResponse.json({ seats, halls, exams, classes, students });
    }
    const seats = await getByPrefix(SEAT_KEY);
    const enriched = halls.map((h: any) => ({ ...h, occupiedSeats: seats.filter((s: any) => s.hallId === h.id).length }));
    return NextResponse.json({ halls: enriched });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (body.action === 'auto_assign') {
      // Auto-assign students to seats in a hall
      const { examId, hallId, classIds, startSeatNum } = body;
      const hall = JSON.parse((await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: HALL_KEY + hallId } } }))?.value || '{}');
      const students = await db.student.findMany({ where: { status: 'active', currentClassId: classIds?.length ? { in: classIds } : undefined }, select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, currentClassId: true, class: { select: { name: true } } }, orderBy: [{ class: { name: 'asc' } }, { rollNumber: 'asc' }] });
      const maxSeats = Number(hall.capacity || 30);
      const created = [] as any[];
      for (let i = 0; i < Math.min(students.length, maxSeats); i++) {
        const s = students[i];
        const seatId = `${Date.now()}_${i}`;
        const seat = { id: seatId, examId, hallId, hallName: hall.name, studentId: s.id, studentName: s.fullName, admissionNumber: s.admissionNumber, rollNumber: s.rollNumber, classId: s.currentClassId, className: s.class?.name, seatNumber: `${startSeatNum || 'A'}${i + 1}`, row: Math.floor(i / (hall.seatsPerRow || 5)) + 1, col: (i % (hall.seatsPerRow || 5)) + 1, createdAt: new Date().toISOString() };
        await db.systemSetting.create({ data: { settingKey: SEAT_KEY + seatId, settingValue: JSON.stringify(seat), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
        created.push(seat);
      }
      return NextResponse.json({ count: created.length });
    }
    const prefix = body.entity === 'hall' ? HALL_KEY : SEAT_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: prefix + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    if (entity === 'all_seats') {
      const all = await getByPrefix(SEAT_KEY);
      const toDelete = all.filter((s: any) => s.examId === id);
      await Promise.all(toDelete.map((s: any) => db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: SEAT_KEY + s.id } } })));
      return NextResponse.json({ count: toDelete.length });
    }
    const prefix = entity === 'hall' ? HALL_KEY : SEAT_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
