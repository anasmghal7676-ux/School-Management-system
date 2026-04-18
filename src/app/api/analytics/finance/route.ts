export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/analytics/finance — Finance dashboard analytics (Module 3.6)
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [
      totalCollectedAgg,
      monthCollectedAgg,
      expenseAgg,
      monthExpenseAgg,
      paymentsByMonth,
      recentPayments,
    ] = await Promise.all([
      db.feePayment.aggregate({
        where: { status: 'Success' },
        _sum: { paidAmount: true },
      }),
      db.feePayment.aggregate({
        where: { status: 'Success', paymentDate: { gte: monthStart } },
        _sum: { paidAmount: true },
      }),
      db.expense.aggregate({ where: { expenseDate: { gte: yearStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      db.expense.aggregate({ where: { expenseDate: { gte: monthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      db.feePayment.groupBy({
        by: ['monthYear'],
        where: { status: 'Success', monthYear: { not: null } },
        _sum: { paidAmount: true },
        orderBy: { monthYear: 'desc' },
        take: 6,
      }),
      db.feePayment.findMany({
        where: { status: 'Success' },
        include: { student: { select: { fullName: true, class: { select: { name: true } } } } },
        orderBy: { paymentDate: 'desc' },
        take: 10,
      }),
    ]);

    const totalCollected = totalCollectedAgg._sum.paidAmount  ?? 0;
    const monthCollected = monthCollectedAgg._sum.paidAmount  ?? 0;
    const totalExpenses  = expenseAgg._sum.amount             ?? 0;
    const monthExpenses  = monthExpenseAgg._sum.amount        ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCollected,
        monthCollected,
        totalExpenses,
        monthExpenses,
        netSurplus: totalCollected - totalExpenses,
        monthlyTrend: (paymentsByMonth as any[]).map(r => ({
          month: r.monthYear,
          collected: r._sum.paidAmount ?? 0,
        })).reverse(),
        recentPayments,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
