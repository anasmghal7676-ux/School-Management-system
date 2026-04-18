export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp      = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';

    const where: any = {};
    if (classId) where.classId = classId;

    const assignments = await db.classSubject.findMany({
      where,
      include: {
        class:   { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true, subjectType: true, maxMarks: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
    });

    // Enrich with teacher details
    const teacherIds = assignments.map(a => a.teacherId).filter(Boolean) as string[];
    const teachers   = teacherIds.length > 0
      ? await db.staff.findMany({ where: { id: { in: teacherIds } }, select: { id: true, firstName: true, lastName: true, designation: true } })
      : [];
    const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]));

    const enriched = assignments.map(a => ({
      ...a,
      teacher: a.teacherId ? teacherMap[a.teacherId] : null,
    }));

    return NextResponse.json({ success: true, data: { assignments: enriched, total: enriched.length } });
  } catch (error) {
    console.error('Class subjects GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { classId, subjectId, isMandatory = true, teacherId } = body;

    if (!classId || !subjectId) {
      return NextResponse.json({ success: false, message: 'classId and subjectId are required' }, { status: 400 });
    }

    const assignment = await db.classSubject.create({
      data: {
        classId,
        subjectId,
        isMandatory,
        teacherId: teacherId || null,
      },
      include: {
        class:   { select: { name: true } },
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'This subject is already assigned to this class' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create assignment' }, { status: 500 });
  }
}

// Bulk assign multiple subjects to a class at once
export async function PUT(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { classId, subjectIds } = body;

    if (!classId || !Array.isArray(subjectIds)) {
      return NextResponse.json({ success: false, message: 'classId and subjectIds array required' }, { status: 400 });
    }

    // Delete all existing for this class, then re-create
    await db.classSubject.deleteMany({ where: { classId } });

    const created = await db.classSubject.createMany({
      data:         subjectIds.map((sid: string) => ({ classId, subjectId: sid, isMandatory: true })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, data: { created: created.count } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Bulk assignment failed' }, { status: 500 });
  }
}
