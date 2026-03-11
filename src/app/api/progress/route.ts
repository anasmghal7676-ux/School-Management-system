export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'studentId is required' }, { status: 400 });
    }

    // Fetch student basic info
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
        parents: {
          select: { firstName: true, lastName: true, relation: true, phone: true, isPrimaryContact: true },
          orderBy: { isPrimaryContact: 'desc' },
          take: 2,
        },
        documents: { select: { documentType: true }, take: 20 },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    // Exam marks across all exams
    const marks = await db.mark.findMany({
      where: { studentId },
      include: {
        examSchedule: {
          include: {
            exam: { select: { title: true, examType: true, academicYear: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Enrich with subject info
    const subjectIds = [...new Set(marks.map(m => m.examSchedule.subjectId))];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));



    // Group marks by exam
    const examMap: Record<string, any> = {};
    marks.forEach(m => {
      const examId = m.examSchedule.examId;
      if (!examMap[examId]) {
        examMap[examId] = {
          examId,
          examTitle:    m.examSchedule.exam.name,
          examType:     m.examSchedule.exam.examType,
          academicYear: m.examSchedule.exam.academicYear?.name,
          subjects: [],
          totalObtained: 0,
          totalMax: 0,
        };
      }
      examMap[examId].subjects.push({
        subject:        subjectMap[m.examSchedule.subjectId]?.name || 'Unknown',
        subjectCode:    subjectMap[m.examSchedule.subjectId]?.code || '',
        obtained:       m.marksObtained,
        total:          (m.examSchedule as any).maxMarks,
        grade:          null,
        percentage:     m.marksObtained != null ? parseFloat(((m.marksObtained / ((m.examSchedule as any).maxMarks || 100)) * 100).toFixed(1)) : null,
        isAbsent:       m.isAbsent,
        isPassing:      null,
      });
      if (!m.isAbsent) {
        examMap[examId].totalObtained += m.marksObtained || 0;
        examMap[examId].totalMax      += (m.examSchedule as any).maxMarks    || 0;
      }
    });

    const exams = Object.values(examMap).map(e => ({
      ...e,
      overallPercentage: e.totalMax > 0 ? parseFloat(((e.totalObtained / e.totalMax) * 100).toFixed(1)) : 0,
    }));

    // Attendance summary
    const attendance = await db.attendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true,
    });
    const attTotal   = attendance.reduce((s, a) => s + a._count, 0);
    const attPresent = attendance.find(a => a.status === 'Present')?._count || 0;
    const attAbsent  = attendance.find(a => a.status === 'Absent')?._count  || 0;
    const attLeave   = attendance.find(a => a.status === 'Leave')?._count   || 0;
    const attPct     = attTotal > 0 ? parseFloat(((attPresent / attTotal) * 100).toFixed(1)) : 0;

    // Monthly attendance trend (last 6 months)
    const attTrend = [] as any[];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const rows = await db.attendance.groupBy({
        by: ['status'],
        where: { studentId, date: { gte: d, lte: end } },
        _count: true,
      });
      const tot = rows.reduce((s, r) => s + r._count, 0);
      const pre = rows.find(r => r.status === 'Present')?._count || 0;
      attTrend.push({
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        pct:   tot > 0 ? parseFloat(((pre / tot) * 100).toFixed(1)) : 0,
        present: pre,
        total: tot,
      });
    }

    // Fee summary
    const fees = await db.feePayment.aggregate({
      where: { studentId },
      _sum: { paidAmount: true, totalAmount: true },
      _count: true,
    });
    const pendingFees = await db.feePayment.aggregate({
      where: { studentId, status: 'Pending' },
      _sum: { paidAmount: true },
      _count: true,
    });
    const fines = await db.feeFine.aggregate({
      where: { studentId, waived: false },
      _sum: { fineAmount: true },
      _count: true,
    });
    const discounts = await db.feeDiscount.findMany({
      where: { studentId, isActive: true },
      select: { discountType: true, percentage: true, fixedAmount: true },
    });

    // Homework submissions
    const submissions = await db.homeworkSubmission.findMany({
      where: { studentId },
      include: { homework: { select: { title: true, subjectId: true, submissionDate: true } } },
      orderBy: { submissionDate: 'desc' },
      take: 10,
    });
    const submissionCount = await db.homeworkSubmission.count({ where: { studentId } });
    const onTimeCount     = submissions.filter(s => s.submissionDate && new Date(s.submissionDate) <= new Date(s.homework.submissionDate)).length;

    // Behavior log
    const behaviors = await db.studentBehaviorLog.findMany({
      where: { studentId },
      orderBy: { incidentDate: 'desc' },
      take: 5,
    });
    const behaviorSummary = await db.studentBehaviorLog.groupBy({
      by: ['incidentType'],
      where: { studentId },
      _count: true,
    });

    // Report cards
    const reportCards = await db.reportCard.findMany({
      where: { studentId },
      include: { exam: { select: { name: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        student,
        exams,
        attendance: {
          total: attTotal, present: attPresent, absent: attAbsent, leave: attLeave,
          percentage: attPct, trend: attTrend,
        },
        fees: {
          totalPaid:     fees._sum.paidAmount    || 0,
          totalBilled:   fees._sum.totalAmount   || 0,
          totalTx:       fees._count,
          pendingAmount: pendingFees._sum.paidAmount || 0,
          pendingCount:  pendingFees._count,
          finesAmount:   fines._sum.fineAmount   || 0,
          finesCount:    fines._count,
          discounts,
        },
        homework: {
          submitted: submissionCount,
          onTime:    onTimeCount,
          recent:    submissions,
        },
        behavior: {
          summary: Object.fromEntries(behaviorSummary.map(b => [b.incidentType, b._count])),
          recent:  behaviors,
        },
        reportCards,
        documents: student.documents,
      },
    });
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch progress data' }, { status: 500 });
  }
}
