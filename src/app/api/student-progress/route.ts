export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stu-progress?studentId=xxx
// Returns complete academic profile for a student
export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ success: false, message: 'studentId required' }, { status: 400 });
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class:   { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    const now       = new Date();
    const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Parallel fetch everything
    const [
      marks,
      attendance,
      feePayments,
      feePending,
      reportCards,
      homeworkSubmissions,
      behaviorLogs,
      documents,
      discounts,
    ] = await Promise.all([
      // All marks with exam schedule details
      db.mark.findMany({
        where:   { studentId },
        include: {
          examSchedule: {
            include: {
              exam:    { select: { title: true, examType: true } },
            },
          },
        },
        orderBy: { examSchedule: { examDate: 'desc' } },
      }),

      // Attendance — last 90 days
      db.attendance.findMany({
        where:   { studentId, date: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } },
        orderBy: { date: 'desc' },
        select:  { id: true, date: true, status: true, remark: true },
      }),

      // Fee payments — last 12 months
      db.feePayment.findMany({
        where:   { studentId, paymentDate: { gte: sixMonths } },
        orderBy: { paymentDate: 'desc' },
        select:  { id: true, receiptNumber: true, paidAmount: true, paymentDate: true, paymentMethod: true, status: true },
      }),

      // Pending fee installments
      db.studentFeeAssignment.findMany({
        where:   { studentId },
        include: { feeStructure: { select: { amount: true, feeType: { select: { name: true } } } } },
        take:    5,
      }),

      // Report cards
      db.reportCard.findMany({
        where:   { studentId },
        orderBy: { generatedAt: 'desc' },
        take:    4,
        include: { exam: { select: { title: true, examType: true } } },
      }),

      // Homework submissions
      db.homeworkSubmission.findMany({
        where:   { studentId },
        include: { homework: { select: { title: true, submissionDate: true, totalMarks: true, subjectId: true } } },
        orderBy: { submissionDate: 'desc' },
        take:    10,
      }),

      // Behavior logs
      db.studentBehaviorLog.findMany({
        where:   { studentId },
        orderBy: { incidentDate: 'desc' },
        take:    8,
        select:  { id: true, incidentDate: true, behaviorType: true, category: true, description: true, actionTaken: true, reportedBy: true },
      }),

      // Documents
      db.studentDocument.findMany({
        where:   { studentId },
        orderBy: { uploadDate: 'desc' },
        select:  { id: true, documentType: true, fileName: true, uploadDate: true },
      }),

      // Active discounts
      db.feeDiscount.findMany({
        where:   { studentId, isActive: true },
        select:  { discountType: true, percentage: true, fixedAmount: true, validTo: true },
      }),
    ]);

    // ── Attendance summary ───────────────────────────────────────────────────
    const attSummary = {
      total:   attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent:  attendance.filter(a => a.status === 'Absent').length,
      late:    attendance.filter(a => a.status === 'Late').length,
      leave:   attendance.filter(a => a.status === 'Leave').length,
    };
    attSummary['rate'] = attSummary.total > 0
      ? parseFloat(((attSummary.present / attSummary.total) * 100).toFixed(1))
      : 0;

    // Monthly attendance breakdown
    const monthlyAtt: Record<string, { present: number; absent: number; late: number; total: number }> = {};
    attendance.forEach(a => {
      const key = a.date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyAtt[key]) monthlyAtt[key] = { present: 0, absent: 0, late: 0, total: 0 };
      monthlyAtt[key].total++;
      if (a.status === 'Present') monthlyAtt[key].present++;
      else if (a.status === 'Absent') monthlyAtt[key].absent++;
      else if (a.status === 'Late') monthlyAtt[key].late++;
    });

    // ── Subject performance ──────────────────────────────────────────────────
    const subjectPerf: Record<string, { obtained: number; total: number; count: number; name: string }> = {};
    marks.forEach(m => {
      const subId   = m.examSchedule?.subjectId || 'unknown';
      const subName = subjectMap[m.examSchedule?.subjectId]?.name || 'Unknown';
      if (!subjectPerf[subId]) subjectPerf[subId] = { obtained: 0, total: 0, count: 0, name: subName };
      if (!m.isAbsent && m.marksObtained != null) {
        subjectPerf[subId].obtained += m.marksObtained;
        subjectPerf[subId].total    += (m.examSchedule as any).maxMarks || 100;
        subjectPerf[subId].count++;
      }
    });

    // Build subject map from examSchedule subjectIds
    const subjectIdsArr = [...new Set(marks.map((m: any) => m.examSchedule?.subjectId).filter(Boolean))];
    const subjectsArr = subjectIdsArr.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIdsArr } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap: Record<string, any> = Object.fromEntries(subjectsArr.map(s => [s.id, s]));

        const subjectSummary = Object.values(subjectPerf)
      .filter(s => s.count > 0)
      .map(s => ({ ...s, percentage: parseFloat(((s.obtained / s.total) * 100).toFixed(1)) }))
      .sort((a, b) => b.percentage - a.percentage);

    // ── Exam-wise marks trend ────────────────────────────────────────────────
    const examTrend = marks
      .filter(m => !m.isAbsent && m.marksObtained != null ? ((m.marksObtained / ((m.examSchedule as any).maxMarks || 100)) * 100) : null != null)
      .slice(0, 20)
      .reverse()
      .map(m => ({
        exam:    m.examSchedule?.exam?.name || 'Exam',
        subject: subjectMap[m.examSchedule?.subjectId]?.name || '',
        pct:     m.marksObtained != null ? ((m.marksObtained / ((m.examSchedule as any).maxMarks || 100)) * 100) : null,
        grade:   null,
      }));

    // ── Fee summary ──────────────────────────────────────────────────────────
    const feeSummary = {
      totalPaid:    feePayments.filter(p => p.status === 'Success').reduce((s, p) => s + p.paidAmount, 0),
      transactions: feePayments.length,
      discounts:    discounts,
    };

    // ── Homework stats ───────────────────────────────────────────────────────
    const hwStats = {
      submitted:  homeworkSubmissions.length,
      late:       homeworkSubmissions.filter(h => h.homework?.submissionDate && new Date(h.submissionDate || h.createdAt) > new Date(h.homework.submissionDate)).length,
      avgMarks:   homeworkSubmissions.filter(h => h.obtainedMarks != null).length > 0
        ? parseFloat((homeworkSubmissions.filter(h => h.obtainedMarks != null).reduce((s, h) => s + (h.obtainedMarks || 0), 0) / homeworkSubmissions.filter(h => h.obtainedMarks != null).length).toFixed(1))
        : null,
    };

    // ── Behavior summary ─────────────────────────────────────────────────────
    const behaviorSummary = {
      total:        behaviorLogs.length,
      positive:     behaviorLogs.filter(b => ['Good', 'Appreciation'].includes(b.behaviorType)).length,
      negative:     behaviorLogs.filter(b => ['Warning', 'Misconduct', 'Suspension'].includes(b.behaviorType)).length,
      logs:         behaviorLogs,
    };

    return NextResponse.json({
      success: true,
      data: {
        student: {
          ...student,
          age: student.dateOfBirth ? Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 86400000)) : null,
        },
        attendance:     { summary: attSummary, monthly: monthlyAtt, recent: attendance.slice(0, 30) },
        marks:          { all: marks.slice(0, 30), trend: examTrend, subjectSummary },
        fees:           { payments: feePayments, summary: feeSummary, pending: feePending },
        reportCards,
        homework:       { submissions: homeworkSubmissions, stats: hwStats },
        behavior:       behaviorSummary,
        documents,
      },
    });
  } catch (error) {
    console.error('Student progress error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load student progress' }, { status: 500 });
  }
}
