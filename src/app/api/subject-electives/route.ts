export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const EL_KEY = 'elective_';
const ENR_KEY = 'elective_enr_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'electives';
    const electiveId = searchParams.get('electiveId') || '';
    const search = searchParams.get('search') || '';
    if (view === 'enrollments') {
      let items = await getByPrefix(ENR_KEY);
      if (electiveId) items = items.filter((i: any) => i.electiveId === electiveId);
      if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s)); }
      const electives = await getByPrefix(EL_KEY);
      const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true, id: true } } }, orderBy: { fullName: 'asc' } });
      return NextResponse.json({ items, electives, students });
    }
    let electives = await getByPrefix(EL_KEY);
    if (search) { const s = search.toLowerCase(); electives = electives.filter((e: any) => e.name?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s)); }
    const enrollments = await getByPrefix(ENR_KEY);
    electives = electives.map((e: any) => ({ ...e, enrolledCount: enrollments.filter((en: any) => en.electiveId === e.id).length }));
    const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ items: electives, subjects, staff, classes });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'enrollment' ? ENR_KEY : EL_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'enrollment' ? ENR_KEY : EL_KEY;
    await db.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'enrollment' ? ENR_KEY : EL_KEY;
    const s = await db.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
