import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'sfeedback_';
async function getAll() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    let items = await getAll();
    if (category) items = items.filter((i: any) => i.category === category);
    if (status) items = items.filter((i: any) => i.status === status);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    const summary = {
      total: items.length,
      pending: items.filter((i: any) => i.status === 'New').length,
      avgRating: items.filter((i: any) => i.rating).length
        ? Math.round((items.filter((i: any) => i.rating).reduce((s: number, i: any) => s + Number(i.rating), 0) / items.filter((i: any) => i.rating).length) * 10) / 10
        : 0,
      byCategory: CATEGORIES.reduce((acc: any, cat: string) => {
        acc[cat] = items.filter((i: any) => i.category === cat).length;
        return acc;
      }, {}),
    };
    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, summary, classes });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
const CATEGORIES = ['Teaching Quality', 'Facilities', 'Canteen / Food', 'Library', 'Transport', 'Administration', 'Hostel', 'Sports', 'General', 'Other'];
export async function POST(req: NextRequest) {
  try {
    // Public endpoint — no auth for students submitting
    const body = await req.json();
    if (body.action === 'update_status') {
      await requireAuth(req);
      const s = await prisma.systemSetting.findUnique({ where: { key: KEY + body.id } });
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const updated = { ...JSON.parse(s.value), status: body.status, response: body.response || '', respondedAt: new Date().toISOString() };
      await prisma.systemSetting.update({ where: { key: KEY + body.id }, data: { value: JSON.stringify(updated) } });
      return NextResponse.json({ ok: true });
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'New', createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
