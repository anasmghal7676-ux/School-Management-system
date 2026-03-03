import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

async function getLogs() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: 'increment_entry_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const staffId = searchParams.get('staffId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let logs = await getLogs();
    if (search) { const s = search.toLowerCase(); logs = logs.filter((l: any) => l.staffName?.toLowerCase().includes(s) || l.staffCode?.toLowerCase().includes(s)); }
    if (staffId) logs = logs.filter((l: any) => l.staffId === staffId);
    logs.sort((a: any, b: any) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    const total = logs.length;
    const paginated = logs.slice((page - 1) * limit, page * limit);
    const staff = await prisma.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, employeeCode: true, designation: true }, orderBy: { fullName: 'asc' } });
    return NextResponse.json({ logs: paginated, total, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const log = { id, ...body, createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: `increment_entry_${id}`, value: JSON.stringify(log) } });
    return NextResponse.json({ log });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await prisma.systemSetting.findUnique({ where: { key: `increment_entry_${id}` } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: `increment_entry_${id}` }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ log: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.systemSetting.delete({ where: { key: `increment_entry_${id}` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
