export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/parent-p?cnic=&phone=&studentId=
// Returns child's complete profile for a parent/guardian
export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const cnic      = sp.get('cnic')      || '';
    const phone     = sp.get('phone')     || '';
    const studentId = sp.get('studentId') || '';

    let student: any = null;

    // Find student via parent CNIC or phone
    if (cnic || phone) {
      const parentWhere: any = {};
      if (cnic)  parentWhere.cnicNumber = cnic;
      if (phone) parentWhere.phone      = phone;

      const parent = await db.studentParent.findFirst({
        where: parentWhere,
        include: {
          student: {
            include: {
              class:   { select: { name: true } },
              section: { select: { name: true } },
            },
          },
        },
      });
      if (parent) student = parent.student;
    }

    if (studentId && !student) {
      student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          class:   { select: { name: true } },
          section: { select: { name: true } },
        },
      });
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found. Please verify your CNIC or phone number.' }, { status: 404 });
    }

    const sid = student.id;
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Fetch data in parallel
    const [attendance, feePayments, homework, reportCards, behaviorLogs] = await Promise.all([
      // Attendance last 30 days
      db.attendance.findMany({
        where: { studentId: sid, date: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      // Fee payments this year
      db.feePayment.findMany({
        where: { studentId: sid, paymentDate: { gte: new Date(new Date().getFullYear(), 0, 1) } },
        include: { items: { include: { feeType: { select: { name: true } } } } },
        orderBy: { paymentDate: 'desc' },
        take: 12,
      }),
      // Homework for student's class
      db.homework.findMany({
        where: {
          classId: student.currentClassId || '',
          OR: [{ sectionId: null }, { sectionId: student.currentSectionId }],
          submissionDate: { gte: new Date() },
        },
        orderBy: { submissionDate: 'asc' },
        take: 10,
      }),
      // Latest report card
      db.reportCard.findFirst({
        where: { studentId: sid },
        orderBy: { generatedAt: 'desc' },
      }),
      // Recent behavior
      db.studentBehaviorLog.findMany({
        where: { studentId: sid },
        orderBy: { incidentDate: 'desc' },
        take: 5,
      }),
    ]);

    // Attendance summary
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const absentDays  = attendance.filter(a => a.status === 'Absent').length;
    const totalDays   = attendance.length;
    const attRate     = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Outstanding fees (pending fee assignments)
    const feeInstallments = await db.studentFeeAssignment.findMany({
      where: { studentId: sid, status: 'Unpaid' },
      include: { feeStructure: { select: { amount: true, feeType: { select: { name: true } } } } },
      take: 6,
    }).catch(() => []);

    // Enrich homework with subject names
    const subjectIds = [...new Set(homework.map(h => h.subjectId).filter(Boolean))] as string[];
    const subjects   = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const homeworkEnriched = homework.map(h => ({ ...h, subject: h.subjectId ? subMap[h.subjectId] : null }));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id:              student.id,
          fullName:        student.fullName,
          admissionNumber: student.admissionNumber,
          rollNumber:      student.rollNumber,
          class:           student.class?.name,
          section:         student.section?.name,
          photo:           student.photo,
          bloodGroup:      student.bloodGroup,
        },
        attendance: {
          summary: { present: presentDays, absent: absentDays, total: totalDays, rate: attRate },
          recent:  attendance.slice(0, 10),
        },
        fees: {
          recentPayments:  feePayments,
          pendingDues:     feeInstallments,
        },
        homework:          homeworkEnriched,
        reportCard:        reportCards,
        behaviorLogs,
      },
    });
  } catch (error) {
    console.error('Parent portal GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch student data' }, { status: 500 });
  }
}
