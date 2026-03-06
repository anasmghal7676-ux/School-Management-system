export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stu-portal?admissionNumber=&rollNumber=&classId=&sectionId=
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const admissionNumber = sp.get('admissionNumber') || '';
    const rollNumber      = sp.get('rollNumber')      || '';
    const classId         = sp.get('classId')         || '';
    const sectionId       = sp.get('sectionId')       || '';

    if (!admissionNumber && !(rollNumber && classId)) {
      return NextResponse.json(
        { success: false, message: 'Provide admission number, OR roll number + class' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (admissionNumber) where.admissionNumber = admissionNumber;
    else {
      where.rollNumber        = rollNumber;
      where.currentClassId    = classId;
      if (sectionId) where.currentSectionId = sectionId;
    }

    const student = await db.student.findFirst({
      where,
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
        parents: { where: { isPrimaryContact: true }, select: { firstName: true, lastName: true, phone: true, relation: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found. Please verify your details.' }, { status: 404 });
    }

    const sid = student.id;
    const now  = new Date();

    const [
      // Attendance last 60 days
      attendance,
      // Fee installments — pending
      pendingFees,
      // Report cards — latest 3
      reportCards,
      // Homework due
      homework,
      // Exam results — recent
      marks,
      // Behavior logs
      behaviorLogs,
    ] = await Promise.all([
      db.attendance.findMany({
        where: { studentId: sid, date: { gte: new Date(Date.now() - 60 * 86400000) } },
        orderBy: { date: 'desc' },
        take: 60,
      }),
      db.feeInstallment.findMany({
        where: { studentId: sid, status: 'Pending' },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }).catch(() => []),
      db.reportCard.findMany({
        where: { studentId: sid },
        orderBy: { generatedAt: 'desc' },
        take: 3,
      }),
      db.homework.findMany({
        where: {
          classId: student.currentClassId || '',
          OR: [{ sectionId: null }, { sectionId: student.currentSectionId }],
          submissionDate: { gte: now },
        },
        orderBy: { submissionDate: 'asc' },
        take: 10,
      }),
      db.mark.findMany({
        where: { studentId: sid },
        include: {
          examSchedule: {
            include: {
              exam:    { select: { title: true } },
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      db.studentBehaviorLog.findMany({
        where: { studentId: sid, incidentType: { in: ['Good', 'Appreciation'] } },
        orderBy: { incidentDate: 'desc' },
        take: 5,
      }),
    ]);

    // Attendance analytics
    const totalDays   = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const absentDays  = attendance.filter(a => a.status === 'Absent').length;
    const lateDays    = attendance.filter(a => a.status === 'Late').length;
    const rate        = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Mark subject-wise average
    const subjectMarks: Record<string, { obtained: number; total: number; count: number }> = {};
    marks.forEach(m => {
      const subj = m.examSchedule?.subject?.name || 'Unknown';
      if (!subjectMarks[subj]) subjectMarks[subj] = { obtained: 0, total: 0, count: 0 };
      subjectMarks[subj].obtained += m.obtainedMarks || 0;
      subjectMarks[subj].total    += m.totalMarks    || 0;
      subjectMarks[subj].count++;
    });
    const subjectPerformance = Object.entries(subjectMarks).map(([name, v]) => ({
      name,
      percentage: v.total > 0 ? Math.round((v.obtained / v.total) * 100) : 0,
      obtained:   v.obtained,
      total:      v.total,
    })).sort((a, b) => b.percentage - a.percentage);

    // Enrich homework with subjects
    const subjectIds = [...new Set(homework.map(h => h.subjectId).filter(Boolean))] as string[];
    const subjects   = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id, fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          class: student.class?.name, section: student.section?.name,
          bloodGroup: student.bloodGroup, dateOfBirth: student.dateOfBirth,
          parentName: student.parents[0] ? `${student.parents[0].firstName} ${student.parents[0].lastName}` : null,
          parentPhone: student.parents[0]?.phone,
        },
        attendance: {
          summary:  { total: totalDays, present: presentDays, absent: absentDays, late: lateDays, rate },
          recent:   attendance.slice(0, 20),
          monthly:  buildMonthly(attendance),
        },
        fees: { pending: pendingFees },
        reportCards,
        homework: homework.map(h => ({ ...h, subject: h.subjectId ? subMap[h.subjectId] : null })),
        recentMarks: marks.slice(0, 10),
        subjectPerformance,
        commendations: behaviorLogs,
      },
    });
  } catch (error) {
    console.error('Student portal GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load student data' }, { status: 500 });
  }
}

function buildMonthly(attendance: any[]) {
  const monthly: Record<string, { present: number; absent: number; late: number }> = {};
  attendance.forEach(a => {
    const key = new Date(a.date).toISOString().slice(0, 7);
    if (!monthly[key]) monthly[key] = { present: 0, absent: 0, late: 0 };
    if (a.status === 'Present') monthly[key].present++;
    if (a.status === 'Absent')  monthly[key].absent++;
    if (a.status === 'Late')    monthly[key].late++;
  });
  return Object.entries(monthly).sort(([a], [b]) => b.localeCompare(a)).map(([month, v]) => ({ month, ...v }));
}
