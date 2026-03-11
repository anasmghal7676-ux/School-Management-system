export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getLogs() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: 'increment_entry_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.settingValue));
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
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, employeeCode: true, designation: true }, orderBy: { fullName: 'asc' } });
    return NextResponse.json({ logs: paginated, total, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const log = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: `increment_entry_${id}`, settingValue: JSON.stringify(log), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ log });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `increment_entry_${id } }` } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `increment_entry_${id } }` }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ log: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `increment_entry_${id } }` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
