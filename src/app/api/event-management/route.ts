export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const EV_KEY = 'event_ev_';
const REG_KEY = 'event_reg_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'events';
    const eventId = searchParams.get('eventId') || '';
    if (view === 'registrations') {
      let regs = await getByPrefix(REG_KEY);
      if (eventId) regs = regs.filter((r: any) => r.eventId === eventId);
      regs.sort((a: any, b: any) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
      const events = await getByPrefix(EV_KEY);
      const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
      const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
      return NextResponse.json({ registrations: regs, events, students, staff });
    }
    const events = await getByPrefix(EV_KEY);
    const regs = await getByPrefix(REG_KEY);
    const today = new Date().toISOString().slice(0, 10);
    const enriched = events.map((e: any) => ({ ...e, registrationCount: regs.filter((r: any) => r.eventId === e.id).length }));
    enriched.sort((a: any, b: any) => (a.eventDate || '').localeCompare(b.eventDate || ''));
    const upcoming = enriched.filter((e: any) => e.eventDate >= today);
    const past = enriched.filter((e: any) => e.eventDate < today);
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ upcoming, past, classes, summary: { total: events.length, upcoming: upcoming.length, past: past.length } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'registration' ? REG_KEY : EV_KEY;
    const item = { id, ...body, registeredAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: prefix + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'registration' ? REG_KEY : EV_KEY;
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'registration' ? REG_KEY : EV_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
