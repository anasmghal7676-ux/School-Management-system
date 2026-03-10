export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const KEY = 'cocurricular_';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let items = await getAll();
    if (search) {
      const s = search.toLowerCase();
      items = items.filter((i: any) => i.name?.toLowerCase().includes(s) || i.coordinator?.toLowerCase().includes(s));
    }
    if (category) items = items.filter((i: any) => i.category === category);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const summary = {
      total,
      active: items.filter((i: any) => i.status === 'Active').length,
      totalEnrollments: items.reduce((s: number, i: any) => s + (i.enrollments?.length || 0), 0),
    };

    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, admissionNumber: true }, include: { class: true }, orderBy: { fullName: 'asc' } });

    return NextResponse.json({ items: items.slice((page - 1) * limit, page * limit), total, summary, staff, students });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();

    // Enroll student
    if (body.action === 'enroll') {
      const { activityId, studentId, studentName, className } = body;
      const s = await db.systemSetting.findUnique({ where: { key: KEY + activityId } });
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const activity = JSON.parse(s.value);
      const enrollments = activity.enrollments || [];
      if (enrollments.find((e: any) => e.studentId === studentId)) {
        return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
      }
      enrollments.push({ studentId, studentName, className, enrolledAt: new Date().toISOString() });
      activity.enrollments = enrollments;
      await db.systemSetting.update({ where: { key: KEY + activityId }, data: { value: JSON.stringify(activity) } });
      return NextResponse.json({ ok: true });
    }

    // Unenroll student
    if (body.action === 'unenroll') {
      const { activityId, studentId } = body;
      const s = await db.systemSetting.findUnique({ where: { key: KEY + activityId } });
      if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const activity = JSON.parse(s.value);
      activity.enrollments = (activity.enrollments || []).filter((e: any) => e.studentId !== studentId);
      await db.systemSetting.update({ where: { key: KEY + activityId }, data: { value: JSON.stringify(activity) } });
      return NextResponse.json({ ok: true });
    }

    // Create activity
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item = { id, ...body, enrollments: [], status: body.status || 'Active', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
