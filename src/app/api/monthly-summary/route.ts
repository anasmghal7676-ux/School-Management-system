export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [
      totalStudents,
      newAdmissions,
      activeStaff,
      feeCollected,
      feePending,
      attendanceData,
      staffAttData,
      homeworkCount,
      examsHeld,
      incidentsCount,
      leavesApproved,
    ] = await Promise.all([
      db.student.count({ where: { status: 'Active' } }),
      db.student.count({ where: { createdAt: { gte: start, lte: end } } }),
      db.staff.count({ where: { status: 'Active' } }),
      db.feePayment.aggregate({ _sum: { amount: true }, where: { status: 'Paid', paidDate: { gte: start, lte: end } } }),
      db.feePayment.aggregate({ _sum: { amount: true }, where: { status: 'Pending' } }),
      db.attendance.groupBy({ by: ['status'], _count: { id: true }, where: { date: { gte: start, lte: end } } }),
      db.staffAttendance.groupBy({ by: ['status'], _count: { id: true }, where: { date: { gte: start, lte: end } } }).catch(() => []),
      db.homework.count({ where: { createdAt: { gte: start, lte: end } } }),
      db.exam.count({ where: { startDate: { gte: start, lte: end } } }),
      db.systemSetting.count({ where: { key: { startsWith: 'incident_' }, updatedAt: { gte: start, lte: end } } }).catch(() => 0),
      db.leave.count({ where: { status: 'Approved', startDate: { gte: start, lte: end } } }),
    ]);

    const stdAtt = { present: 0, absent: 0, late: 0 };
    (attendanceData as any[]).forEach((r: any) => {
      if (r.status === 'Present') stdAtt.present = r._count.id;
      if (r.status === 'Absent') stdAtt.absent = r._count.id;
      if (r.status === 'Late') stdAtt.late = r._count.id;
    });
    const totalStdAtt = stdAtt.present + stdAtt.absent + stdAtt.late;
    const stdAttPct = totalStdAtt > 0 ? Math.round((stdAtt.present / totalStdAtt) * 100) : 0;

    const staffAtt = { present: 0, absent: 0 };
    (staffAttData as any[]).forEach((r: any) => {
      if (r.status === 'Present') staffAtt.present = r._count.id;
      if (r.status === 'Absent') staffAtt.absent = r._count.id;
    });
    const totalStaffAtt = staffAtt.present + staffAtt.absent;
    const staffAttPct = totalStaffAtt > 0 ? Math.round((staffAtt.present / totalStaffAtt) * 100) : 0;

    // Top fee defaulters count
    const defaulterCount = await db.feePayment.groupBy({
      by: ['studentId'],
      where: { status: 'Pending' },
      _count: { id: true },
    }).then(r => r.length).catch(() => 0);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    return NextResponse.json({
      month: monthNames[month - 1],
      year,
      period: `${monthNames[month - 1]} ${year}`,
      enrollment: { total: totalStudents, newAdmissions },
      staffing: { total: activeStaff, leavesApproved },
      finance: { collected: Number(feeCollected._sum.amount || 0), pending: Number(feePending._sum.amount || 0) },
      attendance: { student: { ...stdAtt, pct: stdAttPct }, staff: { ...staffAtt, pct: staffAttPct } },
      academics: { homeworkAssigned: homeworkCount, examsHeld },
      operations: { incidents: incidentsCount, feeDefaulters: defaulterCount },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
