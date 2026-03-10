export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'probation_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.staffName?.toLowerCase().includes(s) || i.reason?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    const today = new Date().toISOString().slice(0, 10);
    items = items.map((i: any) => {
      const daysLeft = i.reviewDate ? Math.ceil((new Date(i.reviewDate).getTime() - new Date(today).getTime()) / 86400000) : null;
      return { ...i, daysLeft, isDueSoon: daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 };
    });
    items.sort((a: any, b: any) => (a.reviewDate || '').localeCompare(b.reviewDate || ''));
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, employeeCode: true, designation: true, department: { select: { id: true, name: true } } }, orderBy: { fullName: 'asc' } });
    const summary = {
      total: items.length,
      active: items.filter((i: any) => i.status === 'On Probation').length,
      dueSoon: items.filter((i: any) => i.isDueSoon && i.status === 'On Probation').length,
      confirmed: items.filter((i: any) => i.status === 'Confirmed').length,
      terminated: items.filter((i: any) => i.status === 'Terminated').length,
    };
    return NextResponse.json({ items, staff, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'On Probation', createdAt: new Date().toISOString() };
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
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'Confirmed') updated.confirmedAt = new Date().toISOString();
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
