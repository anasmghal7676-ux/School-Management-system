export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'contract_';
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
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.staffName?.toLowerCase().includes(s) || i.contractType?.toLowerCase().includes(s)); }

    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const in60 = new Date(); in60.setDate(in60.getDate() + 60);

    items = items.map((i: any) => {
      const exp = i.endDate;
      let contractStatus = i.status || 'Active';
      if (exp && exp < today) contractStatus = 'Expired';
      else if (exp && exp <= in30.toISOString().slice(0, 10)) contractStatus = 'Expiring Soon';
      else if (exp && exp <= in60.toISOString().slice(0, 10)) contractStatus = 'Expiring in 60 days';
      return { ...i, contractStatus };
    });

    if (status) items = items.filter((i: any) => i.contractStatus === status || i.status === status);
    items.sort((a: any, b: any) => (a.endDate || '9999').localeCompare(b.endDate || '9999'));

    const staff = await db.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, employeeCode: true, designation: true, department: true }, orderBy: { fullName: 'asc' } });
    const summary = {
      total: items.length,
      active: items.filter((i: any) => i.contractStatus === 'Active').length,
      expiringSoon: items.filter((i: any) => i.contractStatus === 'Expiring Soon').length,
      expired: items.filter((i: any) => i.contractStatus === 'Expired').length,
    };
    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, summary, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'Active', createdAt: new Date().toISOString() };
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
