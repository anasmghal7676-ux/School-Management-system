export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'asset_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const condition = searchParams.get('condition') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.name?.toLowerCase().includes(s) || i.assetId?.toLowerCase().includes(s) || i.location?.toLowerCase().includes(s)); }
    if (category) items = items.filter((i: any) => i.category === category);
    if (condition) items = items.filter((i: any) => i.condition === condition);
    items.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    const categories = [...new Set(items.map((i: any) => i.category).filter(Boolean))].sort();
    const summary = { total: items.length, good: items.filter((i: any) => i.condition === 'Good').length, needsRepair: items.filter((i: any) => i.condition === 'Needs Repair').length, condemned: items.filter((i: any) => i.condition === 'Condemned').length, totalValue: items.reduce((s: number, i: any) => s + (Number(i.purchaseValue) || 0), 0) };
    return NextResponse.json({ items, categories, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const assetId = `AST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const item = { id, assetId, ...body, createdAt: new Date().toISOString() };
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
