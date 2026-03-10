export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'grievance_';
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
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.subject?.toLowerCase().includes(s) || i.staffName?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, designation: true, department: { select: { id: true, name: true } } }, orderBy: { fullName: 'asc' } });
    const summary = { total: items.length, open: items.filter((i: any) => i.status === 'Open').length, inReview: items.filter((i: any) => i.status === 'Under Review').length, resolved: items.filter((i: any) => i.status === 'Resolved').length };
    return NextResponse.json({ items, summary, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    if (body.action === 'respond') {
      const s = await db.systemSetting.findUnique({ where: { key: KEY + body.id } });
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const updated = { ...JSON.parse(s.value), status: body.status, response: body.response, respondedAt: new Date().toISOString() };
      await db.systemSetting.update({ where: { key: KEY + body.id }, data: { value: JSON.stringify(updated) } });
      return NextResponse.json({ item: updated });
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'Open', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
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
