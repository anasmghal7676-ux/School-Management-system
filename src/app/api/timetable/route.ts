export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp          = request.nextUrl.searchParams;
    const sectionId   = sp.get('sectionId') || '';
    const classId     = sp.get('classId')   || '';
    const academicYearId = sp.get('academicYearId') || '';
    const limit       = Math.min(parseInt(sp.get('limit') || '200'), 200);

    const where: any = {};
    if (sectionId)      where.sectionId     = sectionId;
    if (academicYearId) where.academicYearId = academicYearId;

    // If classId given, resolve to all sections of that class
    if (classId && !sectionId) {
      const sections = await db.section.findMany({ where: { classId }, select: { id: true } });
      where.sectionId = { in: sections.map(s => s.id) };
    }

    const entries = await db.timetable.findMany({
      where,
      include: {
        section:      { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
        slot:         { select: { id: true, dayOfWeek: true, periodNumber: true, startTime: true, endTime: true } },
        staff:        { select: { id: true, fullName: true, firstName: true, lastName: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [{ slot: { dayOfWeek: 'asc' } }, { slot: { periodNumber: 'asc' } }],
      take: limit,
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (e: any) {
    console.error('Timetable GET error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { sectionId, slotId, subjectId, teacherId, roomNumber, academicYearId } = body;

    if (!sectionId || !slotId || !academicYearId) {
      return NextResponse.json({ success: false, error: 'sectionId, slotId, academicYearId required' }, { status: 400 });
    }

    const entry = await db.timetable.upsert({
      where:  { sectionId_slotId: { sectionId, slotId } },
      create: { sectionId, slotId, subjectId: subjectId || null, teacherId: teacherId || null, roomNumber: roomNumber || null, academicYearId },
      update: { subjectId: subjectId || null, teacherId: teacherId || null, roomNumber: roomNumber || null, academicYearId },
      include: {
        slot:  { select: { dayOfWeek: true, periodNumber: true, startTime: true, endTime: true } },
        staff: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (e: any) {
    console.error('Timetable POST error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
