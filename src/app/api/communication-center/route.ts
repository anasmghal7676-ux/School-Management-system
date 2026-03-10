export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const MSG_KEY = 'comm_msg_';
const ANN_KEY = 'comm_ann_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'messages';
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, designation: true, department: { select: { id: true, name: true } } }, orderBy: { fullName: 'asc' } });
    if (view === 'notices') {
      let items = await getByPrefix(ANN_KEY);
      items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json({ items, staff });
    }
    let messages = await getByPrefix(MSG_KEY);
    messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unread = messages.filter((m: any) => !m.read).length;
    return NextResponse.json({ messages, staff, unread });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'announcement' ? ANN_KEY : MSG_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString(), read: false };
    await db.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'announcement' ? ANN_KEY : MSG_KEY;
    const s = await db.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'announcement' ? ANN_KEY : MSG_KEY;
    await db.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
