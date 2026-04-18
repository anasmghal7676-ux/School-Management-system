export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'class_teacher_';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const classes = await db.class.findMany({
      include: { sections: true },
      orderBy: { name: 'asc' },
    });

    const staff = await db.staff.findMany({
      where: { status: 'active' },
      select: { id: true, fullName: true, employeeCode: true, designation: true },
      orderBy: { fullName: 'asc' },
    });

    // Fetch assignments from SystemSetting
    const assignments = await db.systemSetting.findMany({
      where: { settingKey: { startsWith: KEY } },
    });
    const assignmentMap: Record<string, any> = {};
    assignments.forEach((a: any) => {
      const data = JSON.parse(a.settingValue);
      assignmentMap[data.classId + '_' + (data.sectionId || '')] = data;
    });

    return NextResponse.json({ classes, staff, assignmentMap });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { classId, sectionId, staffId, staffName, academicYear, notes } = await req.json();
    if (!classId || !staffId) return NextResponse.json({ error: 'Class and teacher required' }, { status: 400 });

    const key = KEY + classId + '_' + (sectionId || '');
    const value = JSON.stringify({ classId, sectionId: sectionId || null, staffId, staffName, academicYear, notes, assignedAt: new Date().toISOString() });

    await db.systemSetting.upsert({
      where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: key } },
      create: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: key, settingValue: value, settingType: 'General' },
      update: { settingValue: value },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { classId, sectionId } = await req.json();
    const key = KEY + classId + '_' + (sectionId || '');
    await db.systemSetting.deleteMany({ where: { settingKey: key } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
