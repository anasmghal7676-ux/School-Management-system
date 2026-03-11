export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const exams = await db.exam.findMany({ include: { schedules: true }, orderBy: { startDate: 'desc' }, take: 50 });
    // Enrich schedules with subject names
    const subjectIds = [...new Set(exams.flatMap(e => e.schedules.map(s => s.subjectId)))];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const enriched = exams.map(e => ({
      ...e,
      schedules: e.schedules.map(s => ({ ...s, subject: subjectMap[s.subjectId] || null })),
    }));
    return NextResponse.json({ success: true, data: enriched });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
