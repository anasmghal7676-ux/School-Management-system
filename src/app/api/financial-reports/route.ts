export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const reportType = searchParams.get('type') || 'pl';

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    if (reportType === 'pl') {
      // Profit & Loss
      const feePayments = await db.feePayment.findMany({
        where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
        include: { feeType: { select: { name: true, category: true } } },
      });
      const expenses = await db.expense.findMany({
        where: { expenseDate: { gte: startOfYear, lte: endOfYear }, status: { not: 'Rejected' } },
        select: { amount: true, category: true, description: true, expenseDate: true },
      });
      const payrolls = await db.payroll.findMany({
        where: { createdAt: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
        select: { netSalary: true, grossSalary: true, createdAt: true, monthYear: true },
      });

      // Group revenue by fee type
      const revenueByType: Record<string, number> = {};
      feePayments.forEach((p: any) => {
        const name = p.feeType?.name || 'Other';
        revenueByType[name] = (revenueByType[name] || 0) + Number(p.netAmount || p.amount);
      });

      // Group expenses by category
      const expenseByCategory: Record<string, number> = {};
      expenses.forEach((e: any) => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + Number(e.amount); });
      const totalPayroll = payrolls.reduce((s: number, p: any) => s + Number(p.netSalary), 0);

      const totalRevenue = Object.values(revenueByType).reduce((a, b) => a + b, 0);
      const totalExpenses = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
      const netProfit = totalRevenue - totalExpenses - totalPayroll;

      // Quarterly
      const quarters = [1,2,3,4].map(q => {
        const qStart = new Date(`${year}-${String((q-1)*3+1).padStart(2,'0')}-01`);
        const qEnd = new Date(`${year}-${String(q*3).padStart(2,'0')}-${q===2?30:31}T23:59:59`);
        const qRev = feePayments.filter((p: any) => { const d = new Date(p.paymentDate!); return d >= qStart && d <= qEnd; }).reduce((s: number, p: any) => s + Number(p.netAmount || p.amount), 0);
        const qExp = expenses.filter((e: any) => { const d = new Date(e.expenseDate); return d >= qStart && d <= qEnd; }).reduce((s: number, e: any) => s + Number(e.amount), 0);
        const qPay = payrolls.filter((p: any) => { const d = new Date(p.createdAt); return d >= qStart && d <= qEnd; }).reduce((s: number, p: any) => s + Number(p.netSalary), 0);
        return { label: `Q${q} ${year}`, revenue: Math.round(qRev), expenses: Math.round(qExp + qPay), net: Math.round(qRev - qExp - qPay) };
      });

      return NextResponse.json({ type: 'pl', year, revenueByType, expenseByCategory: { ...expenseByCategory, 'Staff Payroll': totalPayroll }, totalRevenue: Math.round(totalRevenue), totalExpenses: Math.round(totalExpenses + totalPayroll), netProfit: Math.round(netProfit), quarters });
    }

    if (reportType === 'fees') {
      const feeTypes = await db.feeType.findMany();
      const result = await Promise.all(feeTypes.map(async (ft: any) => {
        const paid = await db.feePayment.aggregate({ where: { feeTypeId: ft.id, paymentDate: { gte: startOfYear, lte: endOfYear }, status: 'Paid' }, _sum: { netAmount: true, amount: true }, _count: true });
        const pending = await db.feePayment.aggregate({ where: { feeTypeId: ft.id, status: 'Pending' }, _sum: { netAmount: true, amount: true }, _count: true });
        return { name: ft.name, category: ft.category, paidAmount: Math.round(Number(paid._sum.netAmount || paid._sum.amount) || 0), paidCount: paid._count, pendingAmount: Math.round(Number(pending._sum.netAmount || pending._sum.amount) || 0), pendingCount: pending._count };
      }));
      return NextResponse.json({ type: 'fees', year, feeTypes: result.sort((a, b) => b.paidAmount - a.paidAmount) });
    }

    if (reportType === 'payroll') {
      const payrolls = await db.payroll.findMany({
        where: { createdAt: { gte: startOfYear, lte: endOfYear } },
        select: { netSalary: true, grossSalary: true, allowances: true, deductions: true, monthYear: true, status: true, createdAt: true },
      });
      const byMonth: Record<string, any> = {};
      payrolls.forEach((p: any) => {
        const m = p.monthYear || new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!byMonth[m]) byMonth[m] = { month: m, gross: 0, net: 0, allowances: 0, deductions: 0, count: 0, paid: 0 };
        byMonth[m].gross += Number(p.grossSalary);
        byMonth[m].net += Number(p.netSalary);
        byMonth[m].allowances += Number(p.allowances || 0);
        byMonth[m].deductions += Number(p.deductions || 0);
        byMonth[m].count++;
        if (p.status === 'Paid') byMonth[m].paid++;
      });
      return NextResponse.json({ type: 'payroll', year, months: Object.values(byMonth) });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
