export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { reportType, filters, columns, dateFrom, dateTo, classId, sectionId, staffId, limit = 500 } = await req.json();

    const from = dateFrom ? new Date(dateFrom) : undefined;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : undefined;

    let data: any[] = [];
    let headers: string[] = [];

    switch (reportType) {
      case 'students': {
        const where: any = {};
        if (classId) where.classId = classId;
        if (sectionId) where.sectionId = sectionId;
        if (filters?.gender) where.gender = filters.gender;
        if (filters?.status) where.status = filters.status;
        const students = await db.student.findMany({
          where, take: limit, orderBy: { fullName: 'asc' },
          include: { class: true, section: true },
        });
        headers = ['Name', 'Admission No', 'Class', 'Section', 'Father Name', 'Gender', 'DOB', 'Phone', 'Status'];
        data = students.map((s: any) => ({
          Name: s.fullName, 'Admission No': s.admissionNumber, Class: s.class?.name || '',
          Section: s.section?.name || '', 'Father Name': s.fatherName, Gender: s.gender,
          DOB: s.dateOfBirth?.toISOString().slice(0, 10), Phone: s.phone, Status: s.status,
        }));
        break;
      }
      case 'attendance': {
        const where: any = {};
        if (from && to) where.date = { gte: from, lte: to };
        if (classId) where.classId = classId;
        if (filters?.status) where.status = filters.status;
        const records = await db.attendance.findMany({
          where, take: limit, orderBy: { date: 'desc' },
          include: { student: true, class: true, section: true },
        });
        headers = ['Date', 'Student', 'Admission No', 'Class', 'Section', 'Status', 'Remarks'];
        data = records.map((r: any) => ({
          Date: r.date.toISOString().slice(0, 10), Student: r.student.fullName,
          'Admission No': r.student.admissionNumber, Class: r.class?.name || '',
          Section: r.section?.name || '', Status: r.status, Remarks: r.remarks || '',
        }));
        break;
      }
      case 'fees': {
        const where: any = {};
        if (from && to) where.paymentDate = { gte: from, lte: to };
        if (filters?.status) where.status = filters.status;
        const payments = await db.feePayment.findMany({
          where, take: limit, orderBy: { paymentDate: 'desc' },
          include: { student: { include: { class: true } } },
        });
        headers = ['Date', 'Student', 'Class', 'Total Amount', 'Discount', 'Paid Amount', 'Receipt No', 'Mode', 'Status'];
        data = payments.map((p: any) => ({
          Date: p.paymentDate?.toISOString().slice(0, 10), Student: p.student.fullName,
          Class: p.student.class?.name || '',
          'Total Amount': p.totalAmount, Discount: p.discount || 0, 'Paid Amount': p.paidAmount,
          'Receipt No': p.receiptNumber, Mode: p.paymentMode, Status: p.status,
        }));
        break;
      }
      case 'staff': {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.designation) where.designation = { contains: filters.designation };
        const staff = await db.staff.findMany({
          where, take: limit, orderBy: { fullName: 'asc' },
          include: { department: true },
        });
        headers = ['Name', 'Employee Code', 'Designation', 'Department', 'Gender', 'Phone', 'Email', 'Joining Date', 'Status'];
        data = staff.map((s: any) => ({
          Name: s.fullName, 'Employee Code': s.employeeCode, Designation: s.designation,
          Department: s.department?.name || '', Gender: s.gender, Phone: s.phone,
          Email: s.email, 'Joining Date': s.joiningDate?.toISOString().slice(0, 10), Status: s.status,
        }));
        break;
      }
      case 'exam_results': {
        const where: any = {};
        if (filters?.examId) {
          const scheds = await db.examSchedule.findMany({ where: { examId: filters.examId, ...(classId ? { classId } : {}) }, select: { id: true } });
          where.examScheduleId = { in: scheds.map((s: any) => s.id) };
        } else if (classId) {
          const scheds = await db.examSchedule.findMany({ where: { classId }, select: { id: true } });
          where.examScheduleId = { in: scheds.map((s: any) => s.id) };
        }
        const marks = await db.mark.findMany({
          where, take: limit, orderBy: { marksObtained: 'desc' },
          include: { student: true, examSchedule: { include: { exam: true, class: true } } },
        });
        headers = ['Student', 'Class', 'Exam', 'Max Marks', 'Obtained', 'Percentage'];
        data = marks.map((m: any) => ({
          Student: m.student?.fullName || '', Class: m.examSchedule?.class?.name || '',
          Exam: m.examSchedule?.exam?.name || '',
          'Max Marks': m.examSchedule?.maxMarks || 100, Obtained: m.marksObtained ?? '',
          Percentage: m.marksObtained != null ? ((m.marksObtained / (m.examSchedule?.maxMarks || 100)) * 100).toFixed(1) + '%' : '',
        }));
        break;
      }
      case 'payroll': {
        const where: any = {};
        if (filters?.monthYear) where.monthYear = filters.monthYear;
        if (filters?.status) where.status = filters.status;
        const payrolls = await db.payroll.findMany({
          where, take: limit, orderBy: { monthYear: 'desc' },
          include: { staff: { include: { department: true } } },
        });
        headers = ['Staff', 'Employee Code', 'Department', 'Month', 'Basic', 'Gross', 'Deductions', 'Net', 'Status'];
        data = payrolls.map((p: any) => ({
          Staff: p.staff.fullName, 'Employee Code': p.staff.employeeCode,
          Department: p.staff.department?.name || '', Month: p.monthYear,
          Basic: p.basicSalary, Gross: p.grossSalary,
          Deductions: p.grossSalary - p.netSalary, Net: p.netSalary, Status: p.status,
        }));
        break;
      }
      case 'library': {
        const where: any = {};
        if (from && to) where.issueDate = { gte: from, lte: to };
        if (filters?.status) where.status = filters.status;
        const issues = await db.libraryTransaction.findMany({
          where, take: limit, orderBy: { issueDate: 'desc' },
          include: { book: true, student: true },
        });
        headers = ['Issue Date', 'Return Date', 'Book', 'ISBN', 'Borrower', 'Status', 'Fine'];
        data = issues.map((i: any) => ({
          'Issue Date': i.issueDate?.toISOString().slice(0, 10),
          'Return Date': i.returnDate?.toISOString().slice(0, 10) || '',
          Book: i.book?.title || '', ISBN: i.book?.isbn || '',
          Borrower: i.student?.fullName || i.borrowerName || '',
          Status: i.status, Fine: i.fineAmount || 0,
        }));
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json({ data, headers, count: data.length, reportType });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const exams = await db.exam.findMany({ select: { id: true, name: true }, orderBy: { startDate: 'desc' } });
    const months = await db.payroll.findMany({ select: { monthYear: true }, distinct: ['monthYear'], orderBy: { monthYear: 'desc' } });
    return NextResponse.json({ classes, exams, months: months.map((m: any) => m.monthYear) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
