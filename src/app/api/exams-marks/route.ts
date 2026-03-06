export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examScheduleId, examId, classId, subjectId, marks, enteredBy } = body;

    if (!marks || marks.length === 0) {
      return NextResponse.json({ success: false, message: 'Marks array required' }, { status: 400 });
    }

    let scheduleId = examScheduleId;

    // If no scheduleId but examId + classId + subjectId provided, find or create schedule
    if (!scheduleId && examId && classId && subjectId) {
      const existing = await db.examSchedule.findFirst({
        where: { examId, classId, subjectId },
      });
      if (existing) {
        scheduleId = existing.id;
      } else {
        // Get the exam to get dates
        const exam = await db.exam.findUnique({ where: { id: examId } });
        const schedule = await db.examSchedule.create({
          data: {
            examId,
            classId,
            subjectId,
            examDate: exam?.startDate || new Date(),
            startTime: exam?.startDate || new Date(),
            endTime: exam?.endDate || new Date(),
            maxMarks: 100,
            passingMarks: 33,
          },
        });
        scheduleId = schedule.id;
      }
    }

    if (!scheduleId) {
      return NextResponse.json({ success: false, message: 'examScheduleId or (examId + classId + subjectId) required' }, { status: 400 });
    }

    const results = await Promise.all(
      marks.map(async (record: any) => {
        const { studentId, marksObtained, isAbsent, remarks } = record;
        return await db.mark.upsert({
          where: { examScheduleId_studentId: { examScheduleId: scheduleId, studentId } },
          create: { examScheduleId: scheduleId, studentId, marksObtained: isAbsent ? 0 : (marksObtained || 0), isAbsent: isAbsent || false, remarks, enteredBy },
          update: { marksObtained: isAbsent ? 0 : (marksObtained || 0), isAbsent: isAbsent || false, remarks, enteredBy },
        });
      })
    );

    const stats = {
      total: results.length,
      present: results.filter(r => !r.isAbsent).length,
      absent: results.filter(r => r.isAbsent).length,
      passed: results.filter(r => !r.isAbsent && r.marksObtained >= 33).length,
    };

    return NextResponse.json({ success: true, data: { marks: results, stats }, message: `Marks saved for ${results.length} students` });
  } catch (error) {
    console.error('Marks POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save marks' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const examScheduleId = sp.get('examScheduleId');
    const examId = sp.get('examId');
    const classId = sp.get('classId');
    const studentId = sp.get('studentId');

    const where: any = {};
    if (examScheduleId) where.examScheduleId = examScheduleId;
    if (studentId) where.studentId = studentId;
    if (examId) where.examSchedule = { examId };
    if (classId) where.examSchedule = { ...where.examSchedule, classId };

    const marks = await db.mark.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, rollNumber: true, admissionNumber: true } },
        examSchedule: {
          include: {
            exam: { select: { name: true, examType: true } },
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });

    return NextResponse.json({ success: true, data: { marks, total: marks.length } });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch marks' }, { status: 500 });
  }
}
