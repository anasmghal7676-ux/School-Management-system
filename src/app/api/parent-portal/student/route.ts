import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/parent-p/student?admissionNumber=2024-00001
// Returns complete academic snapshot for a student — for parent viewing
export async function GET(request: NextRequest) {
  try {
    const admNo = request.nextUrl.searchParams.get('admissionNumber') || '';
    const id    = request.nextUrl.searchParams.get('studentId') || '';

    if (!admNo && !id) {
      return NextResponse.json({ success: false, message: 'admissionNumber or studentId required' }, { status: 400 });
    }

    const student = await db.student.findFirst({
      where: id ? { id } : { admissionNumber: admNo },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
        parents: true,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const now     = new Date();
    const year    = now.getFullYear();
    const month   = String(now.getMonth() + 1).padStart(2, '0');
    const monthYearStr = `${year}-${month}`;

    // ── Attendance (last 30 days) ────────────────────────────────────────────
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const attendance = await db.attendance.findMany({
      where: { studentId: student.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const attendanceStats = {
      present:  attendance.filter(a => a.status === 'Present').length,
      absent:   attendance.filter(a => a.status === 'Absent').length,
      late:     attendance.filter(a => a.status === 'Late').length,
      total:    attendance.length,
      percentage: attendance.length > 0
        ? Math.round((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100)
        : 0,
      recentDays: attendance.slice(0, 10).map(a => ({
        date:   a.date, status: a.status, remarks: a.remarks,
      })),
    };

    // ── Fee status ──────────────────────────────────────────────────────────
    const feeAssignment = await db.studentFeeAssignment.findFirst({
      where: { studentId: student.id, isActive: true },
    });

    const recentPayments = await db.feePayment.findMany({
      where: { studentId: student.id, status: 'Success' },
      orderBy: { paymentDate: 'desc' },
      take: 6,
      select: { paymentDate: true, paidAmount: true, monthYear: true, receiptNumber: true, paymentMode: true },
    });

    const currentMonthPaid = recentPayments.some(p => p.monthYear === monthYearStr);
    const totalPaid        = recentPayments.reduce((s, p) => s + p.paidAmount, 0);

    // ── Exam Marks (recent 5) ───────────────────────────────────────────────
    const marks = await db.mark.findMany({
      where: { studentId: student.id },
      include: {
        examSchedule: {
          include: { exam: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // ── Homework (current active) ────────────────────────────────────────────
    const homework = await db.homework.findMany({
      where: {
        classId:   student.currentClassId || '',
        submissionDate: { gte: now },
        ...(student.currentSectionId ? { OR: [{ sectionId: student.currentSectionId }, { sectionId: null }] } : {}),
      },
      orderBy: { submissionDate: 'asc' },
      take: 5,
    });

    // ── Behavior log (last 5) ─────────────────────────────────────────────
    const behavior = await db.studentBehaviorLog.findMany({
      where: { studentId: student.id },
      orderBy: { incidentDate: 'desc' },
      take: 5,
      select: { incidentDate: true, incidentType: true, description: true, actionTaken: true, reportedBy: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id, fullName: student.fullName, admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber, gender: student.gender, dateOfBirth: student.dateOfBirth,
          class: student.class, section: student.section, bloodGroup: student.bloodGroup,
          contactNumber: student.contactNumber, fatherName: student.fatherName, motherName: student.motherName,
          status: student.status,
        },
        attendance: attendanceStats,
        fees: {
          monthlyFee: feeAssignment?.finalAmount || 0,
          currentMonthPaid,
          currentMonth: monthYearStr,
          recentPayments,
          totalPaid,
        },
        marks: marks.map(m => ({
          exam:          m.examSchedule?.exam?.title || '',
          obtainedMarks: m.obtainedMarks,
          totalMarks:    m.totalMarks,
          percentage:    m.percentage,
          grade:         m.grade,
          date:          m.createdAt,
        })),
        homework: homework.map(h => ({
          id:             h.id, title: h.title,
          submissionDate: h.submissionDate,
          daysLeft:       Math.ceil((new Date(h.submissionDate).getTime() - now.getTime()) / 86400000),
        })),
        behavior,
      },
    });
  } catch (error) {
    console.error('Parent portal GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch student data' }, { status: 500 });
  }
}
