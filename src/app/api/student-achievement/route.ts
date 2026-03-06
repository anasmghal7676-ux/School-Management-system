export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'achievement_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s) || i.title?.toLowerCase().includes(s) || i.event?.toLowerCase().includes(s)); }
    if (category) items = items.filter((i: any) => i.category === category);
    if (level) items = items.filter((i: any) => i.level === level);
    items.sort((a: any, b: any) => (b.achievementDate || b.createdAt || '').localeCompare(a.achievementDate || a.createdAt || ''));
    const categories = [...new Set(items.map((i: any) => i.category).filter(Boolean))].sort();
    const students = await db.student.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const summary = { total: items.length, gold: items.filter((i: any) => i.position === '1st' || i.medal === 'Gold').length, silver: items.filter((i: any) => i.position === '2nd' || i.medal === 'Silver').length, national: items.filter((i: any) => i.level === 'National').length };
    return NextResponse.json({ items, categories, students, classes, summary });
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
