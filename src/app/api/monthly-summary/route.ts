export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const month = sp.get('month') || new Date().getMonth() + 1;
    const year = sp.get('year') || new Date().getFullYear();
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const [students, staff, attendance, leaves, payments] = await Promise.all([
      db.student.count({ where: { status: 'active' } }),
      db.staff.count({ where: { status: 'active' } }),
      db.attendance.count({ where: { date: { gte: startDate, lte: endDate } } }),
      db.leaveApplication.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      db.feePayment.aggregate({ _sum: { netAmount: true }, where: { paymentDate: { gte: startDate, lte: endDate } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        month: Number(month), year: Number(year),
        students, staff, attendance, leaves,
        feeCollection: payments._sum.netAmount || 0,
      },
    });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
