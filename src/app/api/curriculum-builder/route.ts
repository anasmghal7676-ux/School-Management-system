import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'curriculum_';
async function getAll() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
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
    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
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
    await prisma.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'Completed') updated.completedAt = new Date().toISOString();
    await prisma.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
