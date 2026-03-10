export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  try {
    const sp      = request.nextUrl.searchParams;
    const examId  = sp.get('examId')  || '';
    const classId = sp.get('classId') || '';

    if (!examId) {
      return NextResponse.json({ success: false, message: 'examId required' }, { status: 400 });
    }

    // Fetch all schedules for this exam (optionally filtered by class)
    const schedules = await db.examSchedule.findMany({
      where: {
        examId,
        ...(classId ? { classId } : {}),
        class: { schoolId: SCHOOL_ID },
      },
      include: {
        class:   { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        marks: {
          include: {
            student: { select: { id: true, fullName: true, rollNumber: true, admissionNumber: true } },
          },
        },
      },
      orderBy: { examDate: 'asc' },
    });

    // Build per-subject analytics
    const subjectStats = schedules.map(sched => {
      const validMarks = sched.marks.filter(m => !m.isAbsent && m.marksObtained != null);
      const absentCnt  = sched.marks.filter(m => m.isAbsent).length;
      const total      = sched.marks.length;
      const avg        = validMarks.length > 0
        ? validMarks.reduce((s, m) => s + (m.marksObtained || 0), 0) / validMarks.length : null;
      const passed     = validMarks.filter(m => m.marksObtained! >= sched.passMarks).length;
      const passRate   = validMarks.length > 0 ? Math.round((passed / validMarks.length) * 100) : null;
      const highest    = validMarks.length > 0 ? Math.max(...validMarks.map(m => m.marksObtained!)) : null;
      const lowest     = validMarks.length > 0 ? Math.min(...validMarks.map(m => m.marksObtained!)) : null;

      // Grade distribution
      const gradeDist: Record<string, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
      validMarks.forEach(m => {
        const pct = (m.marksObtained! / sched.maxMarks) * 100;
        if (pct >= 90) gradeDist['A+']++;
        else if (pct >= 80) gradeDist['A']++;
        else if (pct >= 70) gradeDist['B']++;
        else if (pct >= 60) gradeDist['C']++;
        else if (pct >= 50) gradeDist['D']++;
        else gradeDist['F']++;
      });

      return {
        scheduleId: sched.id,
        subject:    sched.subject,
        class:      sched.class,
        examDate:   sched.examDate,
        maxMarks:   sched.maxMarks,
        passMarks:  sched.passMarks,
        total, absentCnt, avg, passRate, highest, lowest, gradeDist,
        studentCount: validMarks.length,
      };
    });

    // Build per-student totals (if classId provided)
    let studentTotals: any[] = [];
    if (classId && schedules.length > 0) {
      const studentMap: Record<string, { student: any; subjects: any[]; total: number; maxTotal: number }> = {};

      schedules.forEach(sched => {
        sched.marks.forEach(mark => {
          if (!studentMap[mark.studentId]) {
            studentMap[mark.studentId] = { student: mark.student, subjects: [], total: 0, maxTotal: 0 };
          }
          const obtained = mark.isAbsent ? 0 : (mark.marksObtained || 0);
          studentMap[mark.studentId].subjects.push({
            subject:  sched.subject?.name,
            obtained,
            max:      sched.maxMarks,
            isAbsent: mark.isAbsent,
          });
          studentMap[mark.studentId].total    += obtained;
          studentMap[mark.studentId].maxTotal += sched.maxMarks;
        });
      });

      studentTotals = Object.values(studentMap)
        .map(s => ({ ...s, percentage: s.maxTotal > 0 ? ((s.total / s.maxTotal) * 100).toFixed(1) : '0' }))
        .sort((a, b) => b.total - a.total)
        .map((s, i) => ({ ...s, rank: i + 1 }));
    }

    // Exam summary
    const exam = await db.exam.findUnique({
      where: { id: examId },
      select: { id: true, name: true, examType: true, startDate: true, endDate: true },
    });

    return NextResponse.json({
      success: true,
      data: { exam, subjectStats, studentTotals, scheduleCount: schedules.length },
    });
  } catch (error) {
    console.error('Exam results error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch exam results' }, { status: 500 });
  }
}
