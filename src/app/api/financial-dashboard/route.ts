import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const today = new Date();

    // Fee collection this year
    const feePayments = await prisma.feePayment.findMany({
      where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
      select: { amount: true, paymentDate: true, netAmount: true },
    });

    // Expenses this year
    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: startOfYear, lte: endOfYear }, status: { not: 'Rejected' } },
      select: { amount: true, expenseDate: true, category: true },
    });

    // Payroll this year
    const payrolls = await prisma.payroll.findMany({
      where: { createdAt: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
      select: { netSalary: true, createdAt: true, monthYear: true },
    });

    // Monthly breakdown
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = MONTHS.map((month, idx) => {
      const mFee = feePayments.filter(p => new Date(p.paymentDate!).getMonth() === idx).reduce((s, p) => s + Number(p.netAmount || p.amount), 0);
      const mExp = expenses.filter(e => new Date(e.expenseDate).getMonth() === idx).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const mPay = payrolls.filter(p => new Date(p.createdAt).getMonth() === idx).reduce((s, p) => s + (Number(p.netSalary) || 0), 0);
      return { month, revenue: Math.round(mFee), expenses: Math.round(mExp + mPay), profit: Math.round(mFee - mExp - mPay) };
    });

    // Fee type breakdown
    const feeByType = await prisma.feePayment.groupBy({
      by: ['feeTypeId'],
      where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
      _sum: { netAmount: true, amount: true },
    });
    const feeTypes = await prisma.feeType.findMany({ select: { id: true, name: true } });
    const feeTypeBreakdown = feeByType.map((f: any) => ({
      name: feeTypes.find((t: any) => t.id === f.feeTypeId)?.name || 'Other',
      amount: Math.round(Number(((f._sum.netAmount) as number | null ?? 0) || ((f._sum.amount) as number | null ?? 0)) || 0),
    })).sort((a: any, b: any) => b.amount - a.amount).slice(0, 8);

    // Expense by category
    const expByCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
    const expenseBreakdown = Object.entries(expByCategory).map(([name, amount]) => ({ name, amount: Math.round(amount) })).sort((a, b) => b.amount - a.amount).slice(0, 8);

    // KPIs
    const totalRevenue = feePayments.reduce((s, p) => s + Number(p.netAmount || p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalPayroll = payrolls.reduce((s, p) => s + (Number(p.netSalary) || 0), 0);
    const netProfit = totalRevenue - totalExpenses - totalPayroll;

    // Pending fees
    const pendingFees = await prisma.feePayment.aggregate({
      where: { status: 'Pending' },
      _sum: { netAmount: true, amount: true },
      _count: true,
    });

    // This month
    const thisMonthRevenue = feePayments.filter(p => new Date(p.paymentDate!).getMonth() === today.getMonth() && new Date(p.paymentDate!).getFullYear() === today.getFullYear()).reduce((s, p) => s + Number(p.netAmount || p.amount), 0);

    // Student count
    const studentCount = await prisma.student.count({ where: { status: 'Active' } });
    const staffCount = await prisma.staff.count({ where: { status: 'Active' } });

    return NextResponse.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses + totalPayroll),
        netProfit: Math.round(netProfit),
        thisMonthRevenue: Math.round(thisMonthRevenue),
        pendingAmount: Math.round(Number(((pendingFees._sum.netAmount) as number | null ?? 0) || ((pendingFees._sum.amount) as number | null ?? 0)) || 0),
        pendingCount: pendingFees._count,
        studentCount,
        staffCount,
      },
      monthly,
      feeTypeBreakdown,
      expenseBreakdown,
      year,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
