export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'lesson_plan_';

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
    const subjectId = searchParams.get('subjectId') || '';
    const week = searchParams.get('week') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.topic?.toLowerCase().includes(s) || i.teacherName?.toLowerCase().includes(s)); }
    if (classId) items = items.filter((i: any) => i.classId === classId);
    if (subjectId) items = items.filter((i: any) => i.subjectId === subjectId);
    if (week) items = items.filter((i: any) => i.weekOf === week);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, designation: true }, orderBy: { fullName: 'asc' } });

    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total: items.length, classes, subjects, staff });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, status: body.status || 'Draft', createdAt: new Date().toISOString() };
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
