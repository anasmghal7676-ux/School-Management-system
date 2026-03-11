export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const where: any = {};
    if (classId) where.student = { currentClassId: classId };
    const marks = await db.mark.findMany({
      where,
      include: {
        student: { include: { class: true } },
        examSchedule: { include: { exam: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    // Enrich with subject info
    const subjectIds = [...new Set(marks.map(m => m.examSchedule.subjectId))];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const enriched = marks.map(m => ({ ...m, subject: subjectMap[m.examSchedule.subjectId] || null }));
    return NextResponse.json({ success: true, data: enriched });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
