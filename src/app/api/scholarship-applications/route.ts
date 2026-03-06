export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'scholarship_app_';
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
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s) || i.scholarshipType?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const students = await db.student.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
    const summary = {
      total: items.length,
      pending: items.filter((i: any) => i.status === 'Pending').length,
      approved: items.filter((i: any) => i.status === 'Approved').length,
      rejected: items.filter((i: any) => i.status === 'Rejected').length,
      totalAwarded: items.filter((i: any) => i.status === 'Approved').reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
    };
    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, summary, students });
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
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'Approved') updated.approvedAt = new Date().toISOString();
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
