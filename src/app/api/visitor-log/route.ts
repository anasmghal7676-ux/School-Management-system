export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'visitor_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date') || '';
    const status = searchParams.get('status') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.visitorName?.toLowerCase().includes(s) || i.purpose?.toLowerCase().includes(s) || i.host?.toLowerCase().includes(s) || i.cnic?.includes(s)); }
    if (date) items = items.filter((i: any) => (i.visitDate || i.createdAt?.slice(0, 10)) === date);
    if (status) items = items.filter((i: any) => (status === 'inside' ? !i.checkOut : i.checkOut));
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const staff = await db.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    const today = new Date().toISOString().slice(0, 10);
    const summary = { total: items.length, todayVisits: items.filter((i: any) => (i.visitDate || i.createdAt?.slice(0, 10)) === today).length, inside: items.filter((i: any) => !i.checkOut).length, checkedOut: items.filter((i: any) => !!i.checkOut).length };
    return NextResponse.json({ items, staff, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const item = { id, ...body, visitDate: now.toISOString().slice(0, 10), checkIn: body.checkIn || now.toTimeString().slice(0, 5), checkOut: null, badgeNo: `V${Math.floor(Math.random() * 9000) + 1000}`, createdAt: now.toISOString() };
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
    if (updates.action === 'checkout') { updated.checkOut = new Date().toTimeString().slice(0, 5); delete updated.action; }
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
