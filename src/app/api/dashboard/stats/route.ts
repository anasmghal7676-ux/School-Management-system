export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = (session.user as any).schoolId || 'school_main';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalStudents,
      prevMonthStudents,
      totalStaff,
      activeAttendance,
      totalAttendanceToday,
      monthFees,
      prevMonthFees,
      recentStudents,
      upcomingEvents,
      pendingFees,
      // Monthly fee chart (last 6 months)
      ...monthlyFeeData
    ] = await Promise.all([
      db.student.count({ where: { schoolId, status: 'active' } }),
      db.student.count({ where: { schoolId, status: 'active', createdAt: { lt: monthStart } } }),
      db.staff.count({ where: { schoolId, status: 'active' } }),
      db.attendance.count({ where: { schoolId, date: { gte: today, lte: todayEnd }, status: 'Present' } }),
      db.attendance.count({ where: { schoolId, date: { gte: today, lte: todayEnd } } }),
      db.feePayment.aggregate({ where: { schoolId, paymentDate: { gte: monthStart }, status: 'Success' }, _sum: { paidAmount: true } }),
      db.feePayment.aggregate({ where: { schoolId, paymentDate: { gte: prevMonthStart, lte: prevMonthEnd }, status: 'Success' }, _sum: { paidAmount: true } }),
      db.student.findMany({
        where: { schoolId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, admissionNumber: true, createdAt: true },
      }),
      db.event.findMany({
        where: { schoolId, eventDate: { gte: today, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { eventDate: 'asc' },
        take: 5,
        select: { id: true, title: true, eventDate: true, eventType: true },
      }),
      db.studentFeeAssignment.count({
        where: { student: { schoolId }, finalAmount: { gt: 0 } },
      }),
      // 6 months of fee data
      ...Array.from({ length: 6 }, (_, i) => {
        const start = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        const end = new Date(today.getFullYear(), today.getMonth() - (5 - i) + 1, 0);
        return db.feePayment.aggregate({
          where: { schoolId, paymentDate: { gte: start, lte: end }, status: 'Success' },
          _sum: { paidAmount: true },
        });
      }),
    ]);

    const attendanceRate = totalAttendanceToday > 0
      ? Math.round((activeAttendance / totalAttendanceToday) * 100)
      : 0;

    const monthlyChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      return {
        month: d.toLocaleString('en-PK', { month: 'short' }),
        amount: (monthlyFeeData[i] as any)?._sum?.paidAmount ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalStaff,
        attendanceRate,
        monthlyFeeCollection: monthFees._sum.paidAmount ?? 0,
        prevMonthFeeCollection: prevMonthFees._sum.paidAmount ?? 0,
        recentStudents,
        upcomingEvents,
        pendingFees,
        monthlyChart,
        studentGrowth: prevMonthStudents > 0
          ? Math.round(((totalStudents - prevMonthStudents) / prevMonthStudents) * 100)
          : 0,
      },
    });
  } catch (error: any) {
    console.error('[Dashboard Stats Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
