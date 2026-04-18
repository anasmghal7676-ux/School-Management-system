export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/timetable/entries?sectionId=&academicYearId=&teacherId=
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const sectionId = sp.get('sectionId') || '';
    const academicYearId = sp.get('academicYearId') || '';
    const teacherId = sp.get('teacherId') || '';

    const where: any = {};
    if (sectionId) where.sectionId = sectionId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (teacherId) where.teacherId = teacherId;

    const entries = await db.timetable.findMany({
      where,
      include: {
        slot: true,
        section: {
          select: { name: true, class: { select: { name: true } } },
        },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ slot: { dayOfWeek: 'asc' } }, { slot: { periodNumber: 'asc' } }],
    });

    // Also fetch subjects for display
    const subjectIds = [...new Set(entries.map(e => e.subjectId).filter(Boolean))] as string[];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    const enriched = entries.map(e => ({
      ...e,
      subject: e.subjectId ? subjectMap[e.subjectId] : null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Timetable entries GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch timetable' }, { status: 500 });
  }
}

// POST /api/timetable/entries — upsert entry (sectionId+slotId = unique)
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { sectionId, slotId, subjectId, teacherId, roomNumber, academicYearId } = body;

    if (!sectionId || !slotId || !academicYearId) {
      return NextResponse.json({ success: false, message: 'sectionId, slotId, academicYearId required' }, { status: 400 });
    }

    // Check teacher clash (same teacher, same slot, different section)
    if (teacherId) {
      const clash = await db.timetable.findFirst({
        where: { slotId, teacherId, sectionId: { not: sectionId } },
        include: { section: { select: { name: true, class: { select: { name: true } } } } },
      });
      if (clash) {
        return NextResponse.json({
          success: false,
          message: `Teacher already assigned to ${clash.section.class.name} ${clash.section.name} in this period`,
        }, { status: 409 });
      }
    }

    const entry = await db.timetable.upsert({
      where: { sectionId_slotId: { sectionId, slotId } },
      create: { sectionId, slotId, subjectId: subjectId || null, teacherId: teacherId || null, roomNumber: roomNumber || null, academicYearId },
      update: { subjectId: subjectId || null, teacherId: teacherId || null, roomNumber: roomNumber || null },
      include: {
        slot: true,
        staff: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Timetable entries POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save timetable entry' }, { status: 500 });
  }
}
