export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'curriculum_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const search = searchParams.get('search') || '';
    let items = await getAll();
    if (classId) items = items.filter((i: any) => i.classId === classId);
    if (subjectId) items = items.filter((i: any) => i.subjectId === subjectId);
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.unitTitle?.toLowerCase().includes(s) || i.topic?.toLowerCase().includes(s)); }
    items.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
    const summary = {
      total: items.length,
      completed: items.filter((i: any) => i.status === 'Completed').length,
      inProgress: items.filter((i: any) => i.status === 'In Progress').length,
      pending: items.filter((i: any) => !i.status || i.status === 'Pending').length,
    };
    return NextResponse.json({ items, classes, subjects, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: 'Pending', createdAt: new Date().toISOString() };
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
    if (updates.status === 'Completed') updated.completedAt = new Date().toISOString();
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
