export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const MENU_KEY = 'canteen_menu_';
const SALE_KEY = 'canteen_sale_';

async function getMenuItems() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: MENU_KEY } } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
async function getSales(date?: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: SALE_KEY } }, orderBy: { updatedAt: 'desc' } });
  let sales = s.map((x: any) => JSON.parse(x.settingValue));
  if (date) sales = sales.filter((x: any) => x.saleDate === date);
  return sales;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'menu';
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const menuItems = await getMenuItems();

    if (view === 'menu') {
      return NextResponse.json({ items: menuItems.sort((a: any, b: any) => a.category?.localeCompare(b.category)) });
    }

    if (view === 'sales') {
      const sales = await getSales(date);
      const totalRevenue = sales.reduce((s: number, x: any) => s + Number(x.totalAmount || 0), 0);
      const totalItems = sales.reduce((s: number, x: any) => s + Number(x.quantity || 0), 0);

      // Last 7 days revenue
      const days: { date: string; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        const daySales = await getSales(ds);
        days.push({ date: ds, revenue: daySales.reduce((s, x: any) => s + Number(x.totalAmount || 0), 0) });
      }

      return NextResponse.json({ sales, totalRevenue, totalItems, days, menuItems });
    }

    return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (body.entity === 'menu') {
      const item = { id, ...body, isAvailable: true, createdAt: new Date().toISOString() };
      await db.systemSetting.create({ data: { settingKey: MENU_KEY + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
      return NextResponse.json({ item });
    }

    // Sale entry
    const menuItem = body.menuItemId ? JSON.parse((await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: MENU_KEY + body.menuItemId } } }))?.value || '{}') : null;
    const totalAmount = Number(body.quantity || 1) * Number(body.unitPrice || menuItem?.price || 0);
    const sale = { id, ...body, totalAmount, saleDate: body.saleDate || new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: SALE_KEY + id, settingValue: JSON.stringify(sale), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ sale });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'menu' ? MENU_KEY : SALE_KEY;
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'menu' ? MENU_KEY : SALE_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
