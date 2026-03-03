import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const VENDOR_KEY = 'vendor_';
const PO_KEY = 'purchase_order_';

async function getVendors() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: VENDOR_KEY } } });
  return s.map((x: any) => JSON.parse(x.value));
}
async function getPOs() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: PO_KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'vendors';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const vendors = await getVendors();

    if (view === 'vendors') {
      let items = vendors;
      if (search) { const s = search.toLowerCase(); items = items.filter((v: any) => v.name?.toLowerCase().includes(s) || v.category?.toLowerCase().includes(s)); }
      return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length });
    }

    let pos = await getPOs();
    if (search) { const s = search.toLowerCase(); pos = pos.filter((p: any) => p.poNumber?.toLowerCase().includes(s) || p.vendorName?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s)); }
    if (status) pos = pos.filter((p: any) => p.status === status);
    pos.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summary = {
      totalVendors: vendors.length,
      totalPOs: pos.length,
      pending: pos.filter((p: any) => p.status === 'Pending').length,
      totalValue: pos.reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
    };

    return NextResponse.json({ items: pos.slice((page - 1) * limit, page * limit), total: pos.length, vendors, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (body.entity === 'vendor') {
      const item = { id, ...body, isActive: true, totalOrders: 0, totalSpent: 0, createdAt: new Date().toISOString() };
      await prisma.systemSetting.create({ data: { key: VENDOR_KEY + id, value: JSON.stringify(item) } });
      return NextResponse.json({ item });
    }

    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const item = { id, poNumber, ...body, status: 'Pending', createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: PO_KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'vendor' ? VENDOR_KEY : PO_KEY;
    const s = await prisma.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'Received') updated.receivedAt = new Date().toISOString();
    await prisma.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'vendor' ? VENDOR_KEY : PO_KEY;
    await prisma.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
