export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const MTG_KEY = 'ptm_meeting_';
const BOOK_KEY = 'ptm_booking_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'meetings';
    const meetingId = searchParams.get('meetingId') || '';
    if (view === 'bookings') {
      let bookings = await getByPrefix(BOOK_KEY);
      if (meetingId) bookings = bookings.filter((b: any) => b.meetingId === meetingId);
      bookings.sort((a: any, b: any) => (a.slot || '').localeCompare(b.slot || ''));
      const meetings = await getByPrefix(MTG_KEY);
      const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true, id: true } }, fatherName: true, fatherPhone: true }, orderBy: { fullName: 'asc' } });
      const summary = { total: bookings.length, attended: bookings.filter((b: any) => b.attended).length, pending: bookings.filter((b: any) => !b.attended).length };
      return NextResponse.json({ bookings, meetings, students, summary });
    }
    const meetings = await getByPrefix(MTG_KEY);
    const bookings = await getByPrefix(BOOK_KEY);
    const enriched = meetings.map((m: any) => ({ ...m, bookingCount: bookings.filter((b: any) => b.meetingId === m.id).length }));
    enriched.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    return NextResponse.json({ meetings: enriched, classes, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'booking' ? BOOK_KEY : MTG_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: prefix + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'booking' ? BOOK_KEY : MTG_KEY;
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'booking' ? BOOK_KEY : MTG_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
