export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/grade-book?examId=&subjectId=&sectionId=
// Returns all students with their marks for bulk entry
export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const examId    = sp.get('examId')    || '';
    const subjectId = sp.get('subjectId') || '';
    const sectionId = sp.get('sectionId') || '';
    const classId   = sp.get('classId')   || '';

    if (!examId) {
      return NextResponse.json({ success: false, message: 'examId required' }, { status: 400 });
    }

    // Find exam schedule for this exam + subject
    const scheduleWhere: any = { examId };
    if (subjectId) scheduleWhere.subjectId = subjectId;

    const schedules = await db.examSchedule.findMany({
      where: scheduleWhere,
      select: { id: true, classId: true, subjectId: true, examDate: true, maxMarks: true, passMarks: true },
    });

    // Get students for the class/section
    const studentWhere: any = { status: 'active' };
    if (sectionId) studentWhere.currentSectionId = sectionId;
    else if (classId) studentWhere.currentClassId = classId;

    const students = await db.student.findMany({
      where: studentWhere,
      select: {
        id: true, fullName: true, rollNumber: true, admissionNumber: true,
        class: { select: { name: true } }, section: { select: { name: true } },
      },
      orderBy: [{ rollNumber: 'asc' }, { fullName: 'asc' }],
    });

    // For each schedule, get existing marks for these students
    const result = await Promise.all(schedules.map(async (schedule) => {
      const existingMarks = await db.mark.findMany({
        where: {
          examScheduleId: schedule.id,
          studentId: { in: students.map(s => s.id) },
        },
        select: {
          id: true, studentId: true, marksObtained: true, isAbsent: true,
        },
      });
      const markMap = Object.fromEntries(existingMarks.map(m => [m.studentId, m]));

      return {
        schedule: {
          id:         schedule.id,
          subjectId:  schedule.subjectId,
          subjectName:schedule.subjectId,
          date:       schedule.examDate,
          maxMarks:   schedule.maxMarks,
          passingMarks: schedule.passMarks,
          
        },
        students: students.map(s => ({
          studentId:  s.id,
          fullName:   s.fullName,
          rollNumber: s.rollNumber,
          admissionNumber: s.admissionNumber,
          class:      s.class?.name,
          section:    s.section?.name,
          markId:     markMap[s.id]?.id || null,
          obtainedMarks: markMap[s.id]?.marksObtained ?? null,
          isAbsent:   markMap[s.id]?.isAbsent ?? false,
          grade:      null,
          percentage: markMap[s.id]?.marksObtained != null ? parseFloat(((markMap[s.id].marksObtained / (schedule.maxMarks || 100)) * 100).toFixed(1)) : null,
        })),
      };
    }));

    return NextResponse.json({ success: true, data: { schedules: result } });
  } catch (error) {
    console.error('Grade book GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch grade book' }, { status: 500 });
  }
}

// POST /api/grade-book - Bulk upsert marks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examScheduleId, marks } = body;
    // marks: [{ studentId, obtainedMarks, isAbsent }]

    if (!examScheduleId || !Array.isArray(marks)) {
      return NextResponse.json({ success: false, message: 'examScheduleId and marks array required' }, { status: 400 });
    }

    const schedule = await db.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: { exam: { include: { gradeScale: { include: { grades: { orderBy: { minPercentage: 'desc' } } } } } } },
    });
    if (!schedule) return NextResponse.json({ success: false, message: 'Exam schedule not found' }, { status: 404 });

    const gradeScales = schedule.exam?.gradeScale?.grades || [];

    const getGrade = (pct: number) => {
      const gs = gradeScales.find(g => pct >= g.minPercentage && pct <= g.maxPercentage);
      return gs?.grade || (pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F');
    };

    let created = 0;
    let updated = 0;

    for (const m of marks) {
      const { studentId, obtainedMarks, isAbsent } = m;
      if (!studentId) continue;

      const pct       = (!isAbsent && obtainedMarks != null && schedule.maxMarks > 0)
        ? parseFloat(((obtainedMarks / schedule.maxMarks) * 100).toFixed(2))
        : null;
      const grade     = pct != null ? getGrade(pct) : null;
      const isPassing = pct != null ? pct >= schedule.passMarks : false;

      const existing = await db.mark.findFirst({
        where: { examScheduleId, studentId },
      });

      if (existing) {
        await db.mark.update({
          where: { id: existing.id },
          data: {
            marksObtained: isAbsent ? null : obtainedMarks,
            isAbsent:      isAbsent || false,
          },
        });
        updated++;
      } else {
        await db.mark.create({
          data: {
            studentId,
            examScheduleId,
            marksObtained: isAbsent ? null : obtainedMarks,
            isAbsent:      isAbsent || false,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, data: { created, updated, total: created + updated } });
  } catch (error) {
    console.error('Grade book POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save marks' }, { status: 500 });
  }
}
