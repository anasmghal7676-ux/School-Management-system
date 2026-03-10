export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const KEY = 'maint_req_';

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
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.title?.toLowerCase().includes(s) || i.location?.toLowerCase().includes(s) || i.reportedBy?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    if (category) items = items.filter((i: any) => i.category === category);
    items.sort((a: any, b: any) => {
      const pOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      if (a.status !== 'Completed' && b.status !== 'Completed' && pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, designation: true }, orderBy: { fullName: 'asc' } });
    const summary = {
      total: items.length,
      open: items.filter((i: any) => i.status === 'Open').length,
      inProgress: items.filter((i: any) => i.status === 'In Progress').length,
      completed: items.filter((i: any) => i.status === 'Completed').length,
      critical: items.filter((i: any) => i.priority === 'Critical' && i.status !== 'Completed').length,
    };

    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, summary, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'Open', createdAt: new Date().toISOString() };
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
    if (updates.status === 'Completed' && !prev.completedAt) updated.completedAt = new Date().toISOString();
    if (updates.status === 'In Progress' && !prev.startedAt) updated.startedAt = new Date().toISOString();
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
