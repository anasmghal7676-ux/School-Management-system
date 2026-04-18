export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/grade-book?classId=&examId=&sectionId=
// Returns grid: students (rows) × subjects (columns) with marks, percentage, grade
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp        = request.nextUrl.searchParams;
    const classId   = sp.get('classId')   || '';
    const examId    = sp.get('examId')    || '';
    const sectionId = sp.get('sectionId') || '';

    if (!classId || !examId) {
      return NextResponse.json({ success: false, error: 'classId and examId are required' }, { status: 400 });
    }

    // Get exam schedules for this exam+class
    const schedules = await db.examSchedule.findMany({
      where: { examId, classId },
      include: { subject: { select: { id: true, name: true, code: true } } },
      orderBy: { examDate: 'asc' },
    });

    if (!schedules.length) {
      return NextResponse.json({ success: true, data: { students: [], subjects: [], marks: {} } });
    }

    // Get students in this class/section
    const studentWhere: any = { currentClassId: classId, status: 'active' };
    if (sectionId) studentWhere.currentSectionId = sectionId;

    const students = await db.student.findMany({
      where: studentWhere,
      select: {
        id: true, fullName: true, admissionNumber: true, rollNumber: true,
        section: { select: { name: true } },
      },
      orderBy: [{ section: { name: 'asc' } }, { fullName: 'asc' }],
    });

    // Get all marks for these schedules
    const scheduleIds = schedules.map(s => s.id);
    const allMarks = await db.mark.findMany({
      where: { examScheduleId: { in: scheduleIds } },
      select: {
        studentId: true, examScheduleId: true,
        marksObtained: true, percentage: true, grade: true, isPassed: true, isAbsent: true,
      },
    });

    // Build marks map: studentId → scheduleId → mark
    const marksMap: Record<string, Record<string, any>> = {};
    for (const m of allMarks) {
      if (!marksMap[m.studentId]) marksMap[m.studentId] = {};
      marksMap[m.studentId][m.examScheduleId] = m;
    }

    // Build grade book rows
    const rows = students.map((student) => {
      const subjectMarks: Record<string, any> = {};
      let totalObtained = 0;
      let totalMax      = 0;
      let allPassed     = true;
      let markedCount   = 0;

      for (const schedule of schedules) {
        const mark = marksMap[student.id]?.[schedule.id];
        if (mark) {
          subjectMarks[schedule.subject.id] = {
            obtained:   mark.marksObtained,
            percentage: mark.percentage,
            grade:      mark.grade,
            isPassed:   mark.isPassed,
            isAbsent:   mark.isAbsent,
          };
          if (!mark.isAbsent && mark.marksObtained != null) {
            totalObtained += mark.marksObtained;
            totalMax      += schedule.maxMarks;
            if (!mark.isPassed) allPassed = false;
            markedCount++;
          }
        } else {
          subjectMarks[schedule.subject.id] = null; // not marked yet
        }
      }

      const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : null;

      return {
        studentId:       student.id,
        fullName:        student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber:      student.rollNumber,
        section:         student.section?.name,
        subjectMarks,
        totalObtained,
        totalMax,
        overallPercentage: overallPct,
        isPassed:        markedCount > 0 && allPassed,
        markedSubjects:  markedCount,
        totalSubjects:   schedules.length,
      };
    });

    // Column averages
    const subjectAverages: Record<string, number | null> = {};
    for (const schedule of schedules) {
      const values = rows
        .map(r => r.subjectMarks[schedule.subject.id]?.obtained)
        .filter((v): v is number => v != null);
      subjectAverages[schedule.subject.id] = values.length
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : null;
    }

    return NextResponse.json({
      success: true,
      data: {
        subjects:       schedules.map(s => ({ id: s.subject.id, name: s.subject.name, code: s.subject.code, maxMarks: s.maxMarks, scheduleId: s.id })),
        students:       rows,
        subjectAverages,
        classAverage:   rows.length ? Math.round(rows.map(r => r.overallPercentage || 0).reduce((a,b)=>a+b,0) / rows.length * 100) / 100 : null,
      },
    });
  } catch (e: any) {
    console.error('Grade book error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
