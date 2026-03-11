export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

async function getSyllabi() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: 'syllabus_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.settingValue));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const academicYearId = searchParams.get('academicYearId') || '';
    const search = searchParams.get('search') || '';

    let syllabi = await getSyllabi();
    if (classId) syllabi = syllabi.filter((s: any) => s.classId === classId);
    if (subjectId) syllabi = syllabi.filter((s: any) => s.subjectId === subjectId);
    if (academicYearId) syllabi = syllabi.filter((s: any) => s.academicYearId === academicYearId);
    if (search) {
      const q = search.toLowerCase();
      syllabi = syllabi.filter((s: any) => s.title?.toLowerCase().includes(q) || s.topics?.some((t: any) => t.name?.toLowerCase().includes(q)));
    }

    syllabi.sort((a: any, b: any) => (a.classId + a.subjectId).localeCompare(b.classId + b.subjectId));

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
    const academicYears = await db.academicYear.findMany({ orderBy: { startDate: 'desc' } });

    // Progress summary
    const summary = {
      total: syllabi.length,
      completed: syllabi.filter((s: any) => {
        const topics = s.topics || [];
        return topics.length > 0 && topics.every((t: any) => t.status === 'Completed');
      }).length,
      inProgress: syllabi.filter((s: any) => {
        const topics = s.topics || [];
        return topics.some((t: any) => t.status === 'In Progress' || t.status === 'Completed') && !topics.every((t: any) => t.status === 'Completed');
      }).length,
      notStarted: syllabi.filter((s: any) => {
        const topics = s.topics || [];
        return topics.length === 0 || topics.every((t: any) => t.status === 'Pending');
      }).length,
    };

    return NextResponse.json({ syllabi, classes, subjects, academicYears, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const syllabus = { id, ...body, topics: body.topics || [], createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: `syllabus_${id}`, settingValue: JSON.stringify(syllabus), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ syllabus });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `syllabus_${id}` } } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(setting.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `syllabus_${id}` } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ syllabus: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `syllabus_${id}` } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
