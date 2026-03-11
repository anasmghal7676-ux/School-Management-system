export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const staff = await db.staff.findMany({
      where: { status: 'active' },
      include: {
        timetable: { include: { section: { include: { class: true } }, slot: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { firstName: 'asc' },
    });
    // Enrich with subject names
    const subjectIds = [...new Set(staff.flatMap(s => s.timetable.map(t => t.subjectId).filter(Boolean) as string[]))];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    const data = staff.map(s => ({
      ...s,
      timetableSlots: s.timetable.map(t => ({
        ...t,
        class: t.section?.class || null,
        subject: t.subjectId ? subjectMap[t.subjectId] || null : null,
      })),
      weeklyPeriods: s.timetable.length,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
