export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear   = new Date(`${year}-12-31T23:59:59`);
    const today       = new Date();

    // Fee collection this year (Success status, paidAmount field)
    const feePayments = await db.feePayment.findMany({
      where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: 'Success' },
      select: { paidAmount: true, paymentDate: true },
    });

    // Expenses this year
    const expenses = await db.expense.findMany({
      where: { expenseDate: { gte: startOfYear, lte: endOfYear } },
      select: { amount: true, expenseDate: true, category: { select: { name: true } } },
    });

    // Payroll this year
    const payrolls = await db.payroll.findMany({
      where: { createdAt: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
      select: { netSalary: true, createdAt: true },
    });

    // Monthly breakdown
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = MONTHS.map((month, idx) => {
      const mFee = feePayments.filter(p => new Date(p.paymentDate).getMonth() === idx).reduce((s, p) => s + Number(p.paidAmount), 0);
      const mExp = expenses.filter(e => new Date(e.expenseDate).getMonth() === idx).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const mPay = payrolls.filter(p => new Date(p.createdAt).getMonth() === idx).reduce((s, p) => s + (Number(p.netSalary) || 0), 0);
      return { month, revenue: Math.round(mFee), expenses: Math.round(mExp + mPay), profit: Math.round(mFee - mExp - mPay) };
    });

    // Expense by category breakdown
    const expByCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category?.name || 'Other'] = (acc[e.category?.name || 'Other'] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
    const expenseBreakdown = Object.entries(expByCategory)
      .map(([name, amount]) => ({ name, amount: Math.round(amount as number) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 8);

    // KPIs
    const totalRevenue  = feePayments.reduce((s, p) => s + Number(p.paidAmount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalPayroll  = payrolls.reduce((s, p) => s + (Number(p.netSalary) || 0), 0);
    const netProfit     = totalRevenue - totalExpenses - totalPayroll;

    const pendingFees = await db.feePayment.aggregate({
      where: { status: 'Pending' },
      _sum: { paidAmount: true },
      _count: true,
    });

    const thisMonthRevenue = feePayments
      .filter(p => new Date(p.paymentDate).getMonth() === today.getMonth() && new Date(p.paymentDate).getFullYear() === today.getFullYear())
      .reduce((s, p) => s + Number(p.paidAmount), 0);

    const [studentCount, staffCount] = await Promise.all([
      db.student.count({ where: { status: 'active' } }),
      db.staff.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      kpis: {
        totalRevenue:      Math.round(totalRevenue),
        totalExpenses:     Math.round(totalExpenses + totalPayroll),
        netProfit:         Math.round(netProfit),
        thisMonthRevenue:  Math.round(thisMonthRevenue),
        pendingAmount:     Math.round(Number(pendingFees._sum?.paidAmount) || 0),
        pendingCount:      pendingFees._count,
        studentCount,
        staffCount,
      },
      monthly,
      expenseBreakdown,
      year,
    });
  } catch (e: any) {
    console.error('Financial dashboard error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
