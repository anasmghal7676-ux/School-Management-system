import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'class_teacher_';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const classes = await prisma.class.findMany({
      include: { sections: true },
      orderBy: { name: 'asc' },
    });

    const staff = await prisma.staff.findMany({
      where: { status: 'Active' },
      select: { id: true, fullName: true, employeeCode: true, designation: true },
      orderBy: { fullName: 'asc' },
    });

    // Fetch assignments from SystemSetting
    const assignments = await prisma.systemSetting.findMany({
      where: { key: { startsWith: KEY } },
    });
    const assignmentMap: Record<string, any> = {};
    assignments.forEach((a: any) => {
      const data = JSON.parse(a.value);
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

    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
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
    await prisma.systemSetting.delete({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
