export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const LAB_KEY = 'lab_';
const EXP_KEY = 'lab_exp_';
const EQUIP_KEY = 'lab_equip_';

async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'labs';
    const search = searchParams.get('search') || '';
    const labId = searchParams.get('labId') || '';

    const labs = await getByPrefix(LAB_KEY);

    if (view === 'labs') {
      let items = labs;
      if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.name?.toLowerCase().includes(s)); }
      return NextResponse.json({ items });
    }

    if (view === 'equipment') {
      let items = await getByPrefix(EQUIP_KEY);
      if (labId) items = items.filter((i: any) => i.labId === labId);
      if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.name?.toLowerCase().includes(s)); }
      const summary = { total: items.length, available: items.filter((i: any) => i.status === 'Available').length, inUse: items.filter((i: any) => i.status === 'In Use').length, maintenance: items.filter((i: any) => i.status === 'Under Maintenance').length };
      return NextResponse.json({ items, labs, summary });
    }

    if (view === 'experiments') {
      let items = await getByPrefix(EXP_KEY);
      if (labId) items = items.filter((i: any) => i.labId === labId);
      if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.title?.toLowerCase().includes(s) || i.subject?.toLowerCase().includes(s)); }
      items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
      const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
      const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
      return NextResponse.json({ items, labs, classes, subjects, staff });
    }

    return NextResponse.json({ labs });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'lab' ? LAB_KEY : body.entity === 'equipment' ? EQUIP_KEY : EXP_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: prefix + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'lab' ? LAB_KEY : entity === 'equipment' ? EQUIP_KEY : EXP_KEY;
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
    const prefix = entity === 'lab' ? LAB_KEY : entity === 'equipment' ? EQUIP_KEY : EXP_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
