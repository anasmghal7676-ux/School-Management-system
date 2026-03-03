import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const LAB_KEY = 'lab_';
const EXP_KEY = 'lab_exp_';
const EQUIP_KEY = 'lab_equip_';

async function getByPrefix(prefix: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
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
      const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
      const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
      const staff = await prisma.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
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
    await prisma.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'lab' ? LAB_KEY : entity === 'equipment' ? EQUIP_KEY : EXP_KEY;
    const s = await prisma.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'lab' ? LAB_KEY : entity === 'equipment' ? EQUIP_KEY : EXP_KEY;
    await prisma.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
