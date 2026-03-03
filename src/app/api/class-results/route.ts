import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/cls-results?examId=&classId=&sectionId=
// Returns mark sheet: rows = students, columns = subjects, with totals, ranks
export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const examId    = sp.get('examId')    || '';
    const classId   = sp.get('classId')   || '';
    const sectionId = sp.get('sectionId') || '';

    if (!examId || !classId) {
      return NextResponse.json({ success: false, message: 'examId and classId required' }, { status: 400 });
    }

    // Get exam details
    const exam = await db.exam.findUnique({
      where:   { id: examId },
      include: { gradeScale: { include: { grades: { orderBy: { minPercentage: 'desc' } } } } },
    });
    if (!exam) return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });

    // Get all exam schedules for this exam
    const schedules = await db.examSchedule.findMany({
      where:   { examId },
      include: { subject: { select: { id: true, name: true, code: true } } },
      orderBy: { subject: { name: 'asc' } },
    });

    // Get students in this class/section
    const studentWhere: any = { status: 'active', currentClassId: classId };
    if (sectionId) studentWhere.currentSectionId = sectionId;
    const students = await db.student.findMany({
      where:   studentWhere,
      select: { id: true, fullName: true, rollNumber: true, admissionNumber: true, gender: true, section: { select: { name: true } } },
      orderBy: [{ rollNumber: 'asc' }, { fullName: 'asc' }],
    });

    if (students.length === 0) {
      return NextResponse.json({ success: true, data: { exam, schedules: [], students: [], rows: [] } });
    }

    // Fetch all marks for these students across all schedules
    const allMarks = await db.mark.findMany({
      where: {
        examScheduleId: { in: schedules.map(s => s.id) },
        studentId:      { in: students.map(s => s.id) },
      },
      select: { studentId: true, examScheduleId: true, obtainedMarks: true, totalMarks: true, isAbsent: true, grade: true, percentage: true },
    });

    // Build mark map: studentId -> scheduleId -> mark
    const markMap: Record<string, Record<string, any>> = {};
    allMarks.forEach(m => {
      if (!markMap[m.studentId]) markMap[m.studentId] = {};
      markMap[m.studentId][m.examScheduleId] = m;
    });

    // Build result rows
    const rows = students.map(student => {
      let totalObtained = 0;
      let totalMax      = 0;
      let absentCount   = 0;

      const subjectMarks = schedules.map(sched => {
        const mark = markMap[student.id]?.[sched.id];
        if (mark) {
          if (mark.isAbsent) {
            absentCount++;
          } else if (mark.obtainedMarks != null) {
            totalObtained += mark.obtainedMarks;
            totalMax      += mark.totalMarks || sched.maxMarks;
          }
        } else {
          // No mark entered yet
          totalMax += sched.maxMarks;
        }
        return {
          scheduleId:    sched.id,
          subjectId:     sched.subjectId,
          subjectName:   sched.subject?.name,
          maxMarks:      sched.maxMarks,
          passingMarks:  sched.passingMarks,
          obtainedMarks: mark?.isAbsent ? null : mark?.obtainedMarks ?? null,
          isAbsent:      mark?.isAbsent ?? false,
          grade:         mark?.grade ?? null,
          percentage:    mark?.percentage ?? null,
          isPassing:     mark && !mark.isAbsent ? (mark.obtainedMarks ?? 0) >= sched.passingMarks : null,
        };
      });

      const overallPct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      const gradeScales = exam.gradeScale?.grades || [];
      const grade = gradeScales.find(g => overallPct >= g.minPercentage && overallPct <= g.maxPercentage)?.grade
        || (overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B' : overallPct >= 60 ? 'C' : overallPct >= 50 ? 'D' : 'F');

      return {
        student,
        subjectMarks,
        totalObtained,
        totalMax,
        overallPct,
        grade,
        absentCount,
        isPassing: overallPct >= 40,
      };
    });

    // Assign ranks (sort by total obtained, descending)
    const ranked = [...rows]
      .sort((a, b) => b.totalObtained - a.totalObtained)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // Restore original order (by roll number), preserving rank
    const rankMap = Object.fromEntries(ranked.map(r => [r.student.id, r.rank]));
    const finalRows = rows.map(r => ({ ...r, rank: rankMap[r.student.id] || 0 }));

    // Summary stats
    const passCount   = finalRows.filter(r => r.isPassing).length;
    const totalStudents = finalRows.length;
    const avgPct      = totalStudents > 0 ? parseFloat((finalRows.reduce((s, r) => s + r.overallPct, 0) / totalStudents).toFixed(1)) : 0;
    const topStudents = [...finalRows].sort((a, b) => b.totalObtained - a.totalObtained).slice(0, 3);

    const class_ = await db.class.findUnique({ where: { id: classId }, select: { name: true } });
    const section_ = sectionId ? await db.section.findUnique({ where: { id: sectionId }, select: { name: true } }) : null;

    return NextResponse.json({
      success: true,
      data: {
        exam:     { ...exam, className: class_?.name, sectionName: section_?.name },
        schedules: schedules.map(s => ({ id: s.id, subjectId: s.subjectId, subjectName: s.subject?.name, maxMarks: s.maxMarks, passingMarks: s.passingMarks })),
        rows:     finalRows,
        summary:  { total: totalStudents, passed: passCount, failed: totalStudents - passCount, passRate: parseFloat(((passCount / totalStudents) * 100).toFixed(1)), avgPct, topStudents },
      },
    });
  } catch (error) {
    console.error('Class results error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate results' }, { status: 500 });
  }
}
