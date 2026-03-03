import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'acad_session_';
async function getAll() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    let items = await getAll();
    items.sort((a: any, b: any) => (b.year || '').localeCompare(a.year || ''));
    const active = items.find((i: any) => i.isActive);
    const summary = { total: items.length, active: active?.year || '—', terms: items.reduce((s: number, i: any) => s + (i.terms?.length || 0), 0) };
    return NextResponse.json({ items, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (body.isActive) {
      // Deactivate all others
      const all = await getAll();
      await Promise.all(all.map(async (a: any) => {
        if (a.isActive) {
          const updated = { ...a, isActive: false };
          await prisma.systemSetting.update({ where: { key: KEY + a.id }, data: { value: JSON.stringify(updated) } });
        }
      }));
    }
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    if (updates.isActive) {
      const all = await getAll();
      await Promise.all(all.filter((a: any) => a.id !== id).map(async (a: any) => {
        await prisma.systemSetting.update({ where: { key: KEY + a.id }, data: { value: JSON.stringify({ ...a, isActive: false }) } });
      }));
    }
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
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
