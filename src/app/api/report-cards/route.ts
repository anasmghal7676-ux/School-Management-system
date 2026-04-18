export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ─── helpers ────────────────────────────────────────────────────────────────

function getGrade(percentage: number): { grade: string; gradePoint: number; remarks: string } {
  if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0, remarks: 'Excellent' };
  if (percentage >= 80) return { grade: 'A',  gradePoint: 3.7, remarks: 'Very Good' };
  if (percentage >= 70) return { grade: 'B+', gradePoint: 3.3, remarks: 'Good' };
  if (percentage >= 60) return { grade: 'B',  gradePoint: 3.0, remarks: 'Above Average' };
  if (percentage >= 50) return { grade: 'C+', gradePoint: 2.3, remarks: 'Average' };
  if (percentage >= 40) return { grade: 'C',  gradePoint: 2.0, remarks: 'Below Average' };
  if (percentage >= 33) return { grade: 'D',  gradePoint: 1.0, remarks: 'Pass' };
  return { grade: 'F', gradePoint: 0.0, remarks: 'Fail' };
}

// ─── GET /api/rpt-cards ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const examId    = sp.get('examId');
    const classId   = sp.get('classId');
    const sectionId = sp.get('sectionId');
    const studentId = sp.get('studentId');
    const page      = parseInt(sp.get('page') || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '30'), 200);

    const where: any = {};
    if (examId)    where.examId    = examId;
    if (studentId) where.studentId = studentId;
    if (classId || sectionId) {
      where.student = {};
      if (classId)   where.student.currentClassId   = classId;
      if (sectionId) where.student.currentSectionId = sectionId;
    }

    const [cards, total] = await Promise.all([
      db.reportCard.findMany({
        where,
        include: {
          student: {
            select: {
              id: true, fullName: true, admissionNumber: true, rollNumber: true, fatherName: true,
              class:   { select: { name: true } },
              section: { select: { name: true } },
            },
          },
          exam: { select: { id: true, name: true, examType: true, startDate: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ percentage: 'desc' }],
      }),
      db.reportCard.count({ where }),
    ]);

    // class-level summary
    const summary = {
      total,
      passed:  cards.filter(c => c.percentage >= 33).length,
      failed:  cards.filter(c => c.percentage < 33).length,
      highest: cards[0]?.percentage ?? 0,
      lowest:  cards[cards.length - 1]?.percentage ?? 0,
      average: total ? cards.reduce((s, c) => s + c.percentage, 0) / cards.length : 0,
    };

    return NextResponse.json({
      success: true,
      data: { cards, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, summary },
    });
  } catch (error) {
    console.error('Report cards GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch report cards' }, { status: 500 });
  }
}

// ─── POST /api/rpt-cards — generate report cards for an exam + class ─────

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { examId, classId, sectionId, generatedBy } = body;

    if (!examId || !classId) {
      return NextResponse.json({ success: false, message: 'examId and classId are required' }, { status: 400 });
    }

    // 1. Fetch all exam schedules for this exam+class
    const schedules = await db.examSchedule.findMany({
      where: { examId, classId },
    });
    const schedSubjectIds = [...new Set(schedules.map(s => s.subjectId))];
    const schedSubjects = schedSubjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: schedSubjectIds } }, select: { id: true, name: true } })
      : [];
    const schedSubjectMap = Object.fromEntries(schedSubjects.map(s => [s.id, s]));
    const schedulesWithSubject = schedules.map(s => ({ ...s, subject: schedSubjectMap[s.subjectId] || null }));

    if (!schedules.length) {
      return NextResponse.json({ success: false, message: 'No exam schedules found for this exam/class' }, { status: 404 });
    }

    // 2. Fetch all students in the class
    const studentQuery: any = { currentClassId: classId, status: 'active' };
    if (sectionId) studentQuery.currentSectionId = sectionId;
    const students = await db.student.findMany({ where: studentQuery, select: { id: true, fullName: true } });

    if (!students.length) {
      return NextResponse.json({ success: false, message: 'No active students found in this class' }, { status: 404 });
    }

    // 3. Fetch all marks for these schedules
    const allMarks = await db.mark.findMany({
      where: { examScheduleId: { in: schedules.map(s => s.id) } },
    });

    const results: any[] = [];
    const errors: string[] = [];

    for (const student of students) {
      try {
        // Aggregate marks across subjects
        let totalMaxMarks  = 0;
        let totalObtained  = 0;
        let subjectDetails: any[] = [];
        let hasAnyMarks    = false;

        for (const schedule of schedulesWithSubject) {
          const mark = allMarks.find(
            m => m.examScheduleId === schedule.id && m.studentId === student.id
          );
          totalMaxMarks += schedule.maxMarks;
          const obtained = mark?.isAbsent ? 0 : (mark?.marksObtained ?? 0);
          totalObtained  += obtained;
          if (mark) hasAnyMarks = true;

          const subPct = schedule.maxMarks > 0 ? (obtained / schedule.maxMarks) * 100 : 0;
          subjectDetails.push({
            subjectId:   schedule.subjectId,
            subjectName: schedule.subject?.name || 'Unknown',
            maxMarks:    schedule.maxMarks,
            obtained,
            percentage:  parseFloat(subPct.toFixed(2)),
            isAbsent:    mark?.isAbsent ?? false,
            grade:       getGrade(subPct).grade,
          });
        }

        if (!hasAnyMarks) continue; // skip students with no marks at all

        const percentage = totalMaxMarks > 0
          ? parseFloat(((totalObtained / totalMaxMarks) * 100).toFixed(2))
          : 0;
        const { grade, gradePoint, remarks } = getGrade(percentage);

        // Attendance percentage for this student
        const attRecords = await db.attendance.findMany({
          where: { studentId: student.id, classId },
          select: { status: true },
        });
        const attPct = attRecords.length
          ? parseFloat(((attRecords.filter(a => a.status === 'Present').length / attRecords.length) * 100).toFixed(1))
          : null;

        const card = await db.reportCard.upsert({
          where: { studentId_examId: { studentId: student.id, examId } },
          create: {
            studentId:           student.id,
            examId,
            totalMarks:          totalMaxMarks,
            marksObtained:       totalObtained,
            percentage,
            grade,
            gradePoint,
            attendancePercentage: attPct,
            remarks,
            generatedBy: generatedBy || 'System',
          },
          update: {
            totalMarks:          totalMaxMarks,
            marksObtained:       totalObtained,
            percentage,
            grade,
            gradePoint,
            attendancePercentage: attPct,
            remarks,
            generatedBy: generatedBy || 'System',
            generatedDate: new Date(),
          },
        });

        results.push({ ...card, studentName: student.fullName, subjectDetails });
      } catch (err) {
        errors.push(`${student.fullName}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    // Assign class ranks
    const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
    for (let i = 0; i < sorted.length; i++) {
      await db.reportCard.update({
        where: { id: sorted[i].id },
        data: { rankInClass: i + 1 },
      });
      sorted[i].rankInClass = i + 1;
    }

    return NextResponse.json({
      success: true,
      data: { generated: results.length, errors, cards: sorted },
      message: `Generated ${results.length} report cards. ${errors.length} errors.`,
    });
  } catch (error) {
    console.error('Report cards POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate report cards' }, { status: 500 });
  }
}
