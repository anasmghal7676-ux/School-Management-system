export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'inv_req_';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.itemName?.toLowerCase().includes(s) || i.requestedBy?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get inventory items for dropdown
    const invItems = await db.inventoryItem.findMany({ select: { id: true, name: true, quantity: true, unit: true }, orderBy: { name: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, department: true }, orderBy: { fullName: 'asc' } });

    const summary = {
      total: items.length,
      pending: items.filter((i: any) => i.status === 'Pending').length,
      approved: items.filter((i: any) => i.status === 'Approved').length,
      issued: items.filter((i: any) => i.status === 'Issued').length,
    };
    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, summary, invItems, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'Pending', createdAt: new Date().toISOString() };
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

    // If issuing, deduct from inventory
    if (updates.status === 'Issued' && prev.inventoryItemId) {
      await db.inventoryItem.updateMany({
        where: { id: prev.inventoryItemId },
        data: { quantity: { decrement: Number(prev.quantityRequested) || 1 } },
      }).catch(() => {});
      updated.issuedAt = new Date().toISOString();
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
