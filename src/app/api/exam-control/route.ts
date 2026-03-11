export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'overview';

    if (view === 'overview') {
      const [exams, totalStudents, totalMarks] = await Promise.all([
        db.exam.findMany({ include: { _count: { select: { schedules: true } } }, orderBy: { startDate: 'desc' } }),
        db.student.count({ where: { status: 'active' } }),
        db.mark.count(),
      ]);
      const classes = await db.class.findMany({ include: { sections: true }, orderBy: { name: 'asc' } });
      const subjects = await db.subject.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ exams, totalStudents, totalMarks, classes, subjects });
    }

    if (view === 'marks') {
      const examId   = searchParams.get('examId');
      const classId  = searchParams.get('classId');
      const subjectId = searchParams.get('subjectId');
      if (!examId) return NextResponse.json({ marks: [] });
      const schedWhere: any = { examId };
      if (classId)   schedWhere.classId   = classId;
      if (subjectId) schedWhere.subjectId = subjectId;
      const schedules = await db.examSchedule.findMany({ where: schedWhere, select: { id: true } });
      const scheduleIds = schedules.map(s => s.id);
      const marks = await db.mark.findMany({
        where: { examScheduleId: { in: scheduleIds } },
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true, currentClassId: true } },
          examSchedule: { select: { subjectId: true, maxMarks: true, passMarks: true } },
        },
        orderBy: [{ student: { fullName: 'asc' } }],
      });
      return NextResponse.json({ marks });
    }

    if (view === 'stats') {
      const examId = searchParams.get('examId');
      if (!examId) return NextResponse.json({ stats: null });
      const scheds = await db.examSchedule.findMany({ where: { examId }, select: { id: true, maxMarks: true, passMarks: true } });
      const schedIds = scheds.map(s => s.id);
      const schedMaxMap: Record<string, number> = Object.fromEntries(scheds.map(s => [s.id, s.maxMarks || 100]));
      const marks = await db.mark.findMany({ where: { examScheduleId: { in: schedIds } }, select: { marksObtained: true, isAbsent: true, examScheduleId: true } });
      const total   = marks.length;
      const absent  = marks.filter(m => m.isAbsent).length;
      const present = total - absent;
      const avgPct  = present > 0
        ? marks.filter(m => !m.isAbsent && m.marksObtained != null)
               .reduce((s, m) => s + ((m.marksObtained || 0) / (schedMaxMap[m.examScheduleId] || 100)) * 100, 0) / (present || 1)
        : 0;
      const grades: Record<string, number> = {};
      marks.filter(m => m.marksObtained != null && !m.isAbsent).forEach(m => {
        const pct = ((m.marksObtained || 0) / (schedMaxMap[m.examScheduleId] || 100)) * 100;
        const g = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
        grades[g] = (grades[g] || 0) + 1;
      });
      const topMarks = await db.mark.findMany({
        where: { examScheduleId: { in: schedIds }, isAbsent: false },
        include: { student: { select: { fullName: true, admissionNumber: true } } },
        orderBy: [{ marksObtained: 'desc' }],
        take: 5,
      });
      return NextResponse.json({ stats: { total, absent, present, avgPct: Math.round(avgPct), grades, topMarks } });
    }

    return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { action } = body;

    if (action === 'create_exam') {
      const { name, examType, startDate, endDate, description, academicYearId } = body;
      let ayId = academicYearId;
      if (!ayId) {
        const ay = await db.academicYear.findFirst({ where: { isCurrent: true } });
        ayId = ay?.id;
      }
      if (!ayId) return NextResponse.json({ error: 'No academic year found' }, { status: 400 });
      const exam = await db.exam.create({
        data: { name, examType: examType || 'Terminal', startDate: new Date(startDate), endDate: new Date(endDate), description: description || null, academicYearId: ayId },
      });
      return NextResponse.json({ exam });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { examId } = await req.json();
    await db.exam.delete({ where: { id: examId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
