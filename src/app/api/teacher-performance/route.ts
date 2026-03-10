export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'teacher_perf_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const period = searchParams.get('period') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.teacherName?.toLowerCase().includes(s) || i.department?.toLowerCase().includes(s)); }
    if (period) items = items.filter((i: any) => i.period === period);
    // Compute overall rating per item
    items = items.map((i: any) => {
      const scores = [i.teaching, i.punctuality, i.communication, i.studentResults, i.professionalism, i.innovation].filter(Boolean).map(Number);
      const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10) / 10 : 0;
      return { ...i, overallRating: avg };
    });
    items.sort((a: any, b: any) => (b.overallRating || 0) - (a.overallRating || 0));
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, employeeCode: true, designation: true, department: true }, orderBy: { fullName: 'asc' } });
    const periods = [...new Set(items.map((i: any) => i.period).filter(Boolean))];
    const summary = {
      total: items.length,
      avgRating: items.length ? Math.round(items.reduce((s: number, i: any) => s + (i.overallRating || 0), 0) / items.length * 10) / 10 : 0,
      excellent: items.filter((i: any) => i.overallRating >= 4.5).length,
      needsImprovement: items.filter((i: any) => i.overallRating < 3).length,
    };
    return NextResponse.json({ items, staff, periods, summary });
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
