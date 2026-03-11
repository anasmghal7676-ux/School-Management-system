export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const HW_KEY = 'hw_assign_';
const SUB_KEY = 'hw_sub_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'assignments';
    const classId = searchParams.get('classId') || '';
    const hwId = searchParams.get('hwId') || '';
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'active', designation: { contains: 'Teacher', mode: 'insensitive' } }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    if (view === 'submissions') {
      let subs = await getByPrefix(SUB_KEY);
      if (hwId) subs = subs.filter((s: any) => s.hwId === hwId);
      subs.sort((a: any, b: any) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());
      const students = await db.student.findMany({ where: { status: 'active', ...(classId ? { currentClassId: classId } : {}) }, select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, class: { select: { name: true } } }, orderBy: [{ rollNumber: 'asc' }, { fullName: 'asc' }] });
      return NextResponse.json({ submissions: subs, students, classes, subjects });
    }
    let assignments = await getByPrefix(HW_KEY);
    if (classId) assignments = assignments.filter((a: any) => a.classId === classId);
    const subs = await getByPrefix(SUB_KEY);
    assignments = assignments.map((a: any) => ({ ...a, submissionCount: subs.filter((s: any) => s.hwId === a.id).length }));
    assignments.sort((a: any, b: any) => (b.dueDate || '').localeCompare(a.dueDate || ''));
    const today = new Date().toISOString().slice(0, 10);
    const summary = { total: assignments.length, active: assignments.filter((a: any) => a.dueDate >= today).length, overdue: assignments.filter((a: any) => a.dueDate < today).length };
    return NextResponse.json({ assignments, classes, subjects, staff, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'submission' ? SUB_KEY : HW_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: prefix + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'submission' ? SUB_KEY : HW_KEY;
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'submission' ? SUB_KEY : HW_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
