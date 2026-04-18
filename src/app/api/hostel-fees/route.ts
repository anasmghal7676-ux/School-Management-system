export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'hostel_fee_entry_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const month = searchParams.get('month') || '';
    const statusFilter = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 200);
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s) || i.admissionNo?.toLowerCase().includes(s)); }
    if (month) items = items.filter((i: any) => i.month === month);
    if (statusFilter) items = items.filter((i: any) => i.status === statusFilter);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    const summary = { total: items.length, paid: items.filter((i: any) => i.status === 'Paid').length, pending: items.filter((i: any) => i.status === 'Pending').length, totalCollected: items.filter((i: any) => i.status === 'Paid').reduce((s: number, i: any) => s + Number(i.amount || 0), 0) };
    const hostelStudents = await db.student.findMany({ where: { hostelId: { not: null } }, include: { class: true }, orderBy: { fullName: 'asc' } });
    return NextResponse.json({ items: items.slice((page-1)*limit, page*limit), total, summary, hostelStudents });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const item = { id, ...body, status: body.status || 'Pending', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: KEY + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
