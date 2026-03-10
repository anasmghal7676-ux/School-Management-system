export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'biometric_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const staffId = searchParams.get('staffId') || '';
    let items = await getAll();
    if (date) items = items.filter((i: any) => i.date === date);
    if (staffId) items = items.filter((i: any) => i.staffId === staffId);
    items.sort((a: any, b: any) => (a.clockIn || '').localeCompare(b.clockIn || ''));
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, employeeCode: true, designation: true, department: { select: { id: true, name: true } } }, orderBy: { fullName: 'asc' } });
    const summary = { total: items.length, onTime: items.filter((i: any) => !i.isLate).length, late: items.filter((i: any) => i.isLate).length, earlyLeave: items.filter((i: any) => i.earlyLeave).length };
    return NextResponse.json({ items, summary, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const clockIn = body.clockIn || new Date().toTimeString().slice(0, 5);
    const isLate = clockIn > (body.scheduledIn || '08:00');
    const item: any = { id, ...body, clockIn, isLate, createdAt: new Date().toISOString() };
    if (body.clockOut) {
      const [ih, im] = clockIn.split(':').map(Number);
      const [oh, om] = body.clockOut.split(':').map(Number);
      item.hoursWorked = Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 10) / 10;
      item.earlyLeave = body.clockOut < (body.scheduledOut || '17:00');
    }
    await db.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { key: KEY + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const prev = JSON.parse(s.value);
    const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
    if (updates.clockOut) {
      const [ih, im] = (updated.clockIn || '08:00').split(':').map(Number);
      const [oh, om] = updates.clockOut.split(':').map(Number);
      updated.hoursWorked = Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 10) / 10;
      updated.earlyLeave = updates.clockOut < (updated.scheduledOut || '17:00');
    }
    await db.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
