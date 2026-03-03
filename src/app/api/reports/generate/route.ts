import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, classId, sectionId, startDate, endDate, examId, monthYear, format } = body;

    if (!reportType) {
      return NextResponse.json({ success: false, message: 'reportType required' }, { status: 400 });
    }

    const dateFrom = startDate ? new Date(startDate) : undefined;
    const dateTo   = endDate   ? new Date(endDate + 'T23:59:59') : undefined;

    let data: any = null;
    let columns: string[] = [];
    let title = '';

    // ─── STUDENT REPORTS ─────────────────────────────────────────────────────
    if (reportType === 'student_list') {
      title = 'Student List';
      const where: any = { status: 'active' };
      if (classId)   where.currentClassId   = classId;
      if (sectionId) where.currentSectionId = sectionId;
      const students = await db.student.findMany({
        where,
        include: {
          class:   { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: [{ class: { name: 'asc' } }, { rollNumber: 'asc' }],
      });
      columns = ['Adm No', 'Name', 'Class', 'Section', 'Roll No', 'Gender', 'DOB', 'Father', 'Contact', 'Status'];
      data = students.map(s => ({
        'Adm No':  s.admissionNumber,
        'Name':    s.fullName,
        'Class':   s.class?.name || '',
        'Section': s.section?.name || '',
        'Roll No': s.rollNumber || '',
        'Gender':  s.gender,
        'DOB':     s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '',
        'Father':  s.fatherName || '',
        'Contact': s.contactNumber || '',
        'Status':  s.status,
      }));
    }

    else if (reportType === 'student_attendance') {
      title = 'Attendance Report';
      const where: any = {};
      if (classId)   where.classId   = classId;
      if (sectionId) where.sectionId = sectionId;
      if (dateFrom)  where.date      = { ...(where.date || {}), gte: dateFrom };
      if (dateTo)    where.date      = { ...(where.date || {}), lte: dateTo };

      const recs = await db.attendance.findMany({
        where,
        include: { student: { select: { fullName: true, admissionNumber: true, rollNumber: true } } },
        orderBy: [{ date: 'asc' }, { student: { rollNumber: 'asc' } }],
      });

      // Group by student
      const byStudent: Record<string, { name: string; admNo: string; present: number; absent: number; late: number; total: number }> = {};
      recs.forEach(r => {
        if (!byStudent[r.studentId]) {
          byStudent[r.studentId] = { name: r.student.fullName, admNo: r.student.admissionNumber, present: 0, absent: 0, late: 0, total: 0 };
        }
        byStudent[r.studentId].total++;
        if (r.status === 'Present')  byStudent[r.studentId].present++;
        if (r.status === 'Absent')   byStudent[r.studentId].absent++;
        if (r.status === 'Late')     byStudent[r.studentId].late++;
      });

      columns = ['Adm No', 'Name', 'Present', 'Absent', 'Late', 'Total Days', 'Attendance %'];
      data = Object.values(byStudent).map(s => ({
        'Adm No':       s.admNo,
        'Name':         s.name,
        'Present':      s.present,
        'Absent':       s.absent,
        'Late':         s.late,
        'Total Days':   s.total,
        'Attendance %': s.total > 0 ? `${Math.round((s.present / s.total) * 100)}%` : '0%',
      }));
    }

    // ─── FEE REPORTS ─────────────────────────────────────────────────────────
    else if (reportType === 'fee_collection') {
      title = 'Fee Collection Report';
      const where: any = { status: 'Success' };
      if (dateFrom) where.paymentDate = { ...(where.paymentDate || {}), gte: dateFrom };
      if (dateTo)   where.paymentDate = { ...(where.paymentDate || {}), lte: dateTo };
      if (monthYear) where.monthYear = monthYear;

      const payments = await db.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              fullName: true, admissionNumber: true,
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      });

      columns = ['Date', 'Receipt No', 'Adm No', 'Student', 'Class', 'Amount', 'Mode', 'Month'];
      data = payments.map(p => ({
        'Date':       new Date(p.paymentDate).toLocaleDateString(),
        'Receipt No': p.receiptNumber,
        'Adm No':     p.student?.admissionNumber || '',
        'Student':    p.student?.fullName || '',
        'Class':      p.student?.class?.name || '',
        'Amount':     p.paidAmount,
        'Mode':       p.paymentMode,
        'Month':      p.monthYear || '',
      }));

      const totalCollected = payments.reduce((s, p) => s + p.paidAmount, 0);
      return NextResponse.json({ success: true, data: { title, columns, rows: data, summary: { totalCollected, count: payments.length } } });
    }

    else if (reportType === 'fee_defaulters') {
      title = 'Fee Defaulters Report';
      // Students with outstanding balance
      const students = await db.student.findMany({
        where: { status: 'active', ...(classId ? { currentClassId: classId } : {}) },
        include: {
          class:   { select: { name: true } },
          section: { select: { name: true } },
          feePayments: { where: { status: 'Success' }, select: { paidAmount: true } },
          feeAssignments: { select: { finalAmount: true } },
        },
        orderBy: { class: { name: 'asc' } },
      });

      const defaulters = students.filter(s => {
        const paid     = s.feePayments.reduce((sum, p) => sum + p.paidAmount, 0);
        const expected = (s.feeAssignments[0]?.finalAmount || 0) * 3; // rough 3-month estimate
        return paid < expected;
      });

      columns = ['Adm No', 'Name', 'Class', 'Contact'];
      data = defaulters.map(s => ({
        'Adm No':  s.admissionNumber,
        'Name':    s.fullName,
        'Class':   s.class?.name || '',
        'Contact': s.contactNumber || '',
      }));
    }

    // ─── EXAM / MARKS REPORTS ────────────────────────────────────────────────
    else if (reportType === 'exam_results') {
      title = 'Exam Results Report';
      const where: any = {};
      if (examId)    where.examSchedule = { examId };
      if (classId)   where.student      = { currentClassId: classId };
      if (sectionId) where.student      = { ...(where.student || {}), currentSectionId: sectionId };

      const marks = await db.mark.findMany({
        where,
        include: {
          student: { select: { fullName: true, admissionNumber: true, rollNumber: true } },
          examSchedule: {
            include: {
              exam:    { select: { title: true } },
            },
          },
        },
        orderBy: [{ student: { rollNumber: 'asc' } }],
      });

      columns = ['Roll No', 'Adm No', 'Student', 'Exam', 'Obtained', 'Total', 'Percentage', 'Grade'];
      data = marks.map(m => ({
        'Roll No':    m.student.rollNumber || '',
        'Adm No':     m.student.admissionNumber,
        'Student':    m.student.fullName,
        'Exam':       m.examSchedule?.exam?.title || '',
        'Obtained':   m.obtainedMarks ?? 0,
        'Total':      m.totalMarks,
        'Percentage': m.percentage ? `${m.percentage.toFixed(1)}%` : '',
        'Grade':      m.grade || '',
      }));
    }

    // ─── PAYROLL REPORTS ────────────────────────────────────────────────────
    else if (reportType === 'payroll_summary') {
      title = 'Payroll Summary';
      const where: any = {};
      if (monthYear) where.salaryMonth = monthYear;
      if (dateFrom)  where.processedDate = { gte: dateFrom };
      if (dateTo)    where.processedDate = { ...((where.processedDate as any) || {}), lte: dateTo };

      const payrolls = await db.payroll.findMany({
        where,
        include: { staff: { select: { firstName: true, lastName: true, employeeId: true, designation: true } } },
        orderBy: [{ salaryMonth: 'desc' }, { staff: { lastName: 'asc' } }],
      });

      columns = ['Emp ID', 'Name', 'Designation', 'Month', 'Gross', 'Deductions', 'Net', 'Status'];
      data = payrolls.map(p => ({
        'Emp ID':       p.staff?.employeeId || '',
        'Name':         `${p.staff?.firstName || ''} ${p.staff?.lastName || ''}`.trim(),
        'Designation':  p.staff?.designation || '',
        'Month':        p.salaryMonth,
        'Gross':        p.grossSalary,
        'Deductions':   p.totalDeductions,
        'Net':          p.netSalary,
        'Status':       p.status,
      }));

      const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);
      return NextResponse.json({ success: true, data: { title, columns, rows: data, summary: { totalNet, count: payrolls.length } } });
    }

    else {
      return NextResponse.json({ success: false, message: `Unknown reportType: ${reportType}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { title, columns, rows: data || [], summary: { count: data?.length || 0 } } });
  } catch (error) {
    console.error('Report generate error:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate report' }, { status: 500 });
  }
}
