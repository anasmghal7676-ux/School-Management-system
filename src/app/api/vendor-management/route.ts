export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const VENDOR_KEY = 'vendor_';
const PO_KEY = 'purchase_order_';

async function getVendors() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: VENDOR_KEY } } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
async function getPOs() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: PO_KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
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
      await db.systemSetting.create({ data: { settingKey: VENDOR_KEY + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
      return NextResponse.json({ item });
    }

    const poNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const item = { id, poNumber, ...body, status: 'Pending', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: PO_KEY + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'vendor' ? VENDOR_KEY : PO_KEY;
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'Received') updated.receivedAt = new Date().toISOString();
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'vendor' ? VENDOR_KEY : PO_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
