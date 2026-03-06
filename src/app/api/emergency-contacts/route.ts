export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'emg_contact_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s) || i.contactName?.toLowerCase().includes(s) || i.phone?.includes(s)); }
    if (classId) items = items.filter((i: any) => i.classId === classId);
    items.sort((a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || ''));
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const students = await db.student.findMany({
      where: { status: 'Active', ...(classId ? { classId } : {}) },
      select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true, id: true } } },
      orderBy: { fullName: 'asc' }
    });
    return NextResponse.json({ items, classes, students });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, createdAt: new Date().toISOString() };
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
