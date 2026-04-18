export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const reportType = searchParams.get('type') || 'pl';

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear   = new Date(`${year}-12-31T23:59:59`);

    if (reportType === 'pl') {
      // Profit & Loss — use paidAmount from FeePayment (no feeType direct relation)
      const feePayments = await db.feePayment.findMany({
        where: { paymentDate: { gte: startOfYear, lte: endOfYear }, status: 'Success' },
        select: { paidAmount: true, paymentDate: true },
      });
      const expenses = await db.expense.findMany({
        where: { expenseDate: { gte: startOfYear, lte: endOfYear } },
        select: { amount: true, expenseDate: true, category: { select: { name: true } } },
      });
      const payrolls = await db.payroll.findMany({
        where: { createdAt: { gte: startOfYear, lte: endOfYear }, status: 'Paid' },
        select: { netSalary: true, grossSalary: true, createdAt: true, monthYear: true },
      });

      const totalRevenue  = feePayments.reduce((s, p) => s + Number(p.paidAmount), 0);
      const expByCategory: Record<string, number> = {};
      expenses.forEach((e: any) => {
        const cat = e.category?.name || 'Other';
        expByCategory[cat] = (expByCategory[cat] || 0) + Number(e.amount);
      });
      const totalPayroll  = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);
      const totalExpenses = Object.values(expByCategory).reduce((a, b) => a + b, 0);
      const netProfit     = totalRevenue - totalExpenses - totalPayroll;

      const quarters = [1,2,3,4].map(q => {
        const qStart = new Date(`${year}-${String((q-1)*3+1).padStart(2,'0')}-01`);
        const qEnd   = new Date(`${year}-${String(q*3).padStart(2,'0')}-${q===2?30:31}T23:59:59`);
        const qRev = feePayments.filter(p => { const d = new Date(p.paymentDate); return d >= qStart && d <= qEnd; }).reduce((s, p) => s + Number(p.paidAmount), 0);
        const qExp = expenses.filter((e: any) => { const d = new Date(e.expenseDate); return d >= qStart && d <= qEnd; }).reduce((s, e: any) => s + Number(e.amount), 0);
        const qPay = payrolls.filter(p => { const d = new Date(p.createdAt); return d >= qStart && d <= qEnd; }).reduce((s, p) => s + Number(p.netSalary), 0);
        return { label: `Q${q} ${year}`, revenue: Math.round(qRev), expenses: Math.round(qExp + qPay), net: Math.round(qRev - qExp - qPay) };
      });

      return NextResponse.json({
        type: 'pl', year,
        revenueByType: { 'Fee Collection': Math.round(totalRevenue) },
        expenseByCategory: { ...Object.fromEntries(Object.entries(expByCategory).map(([k,v]) => [k, Math.round(v as number)])), 'Staff Payroll': Math.round(totalPayroll) },
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses + totalPayroll),
        netProfit: Math.round(netProfit),
        quarters,
      });
    }

    if (reportType === 'fees') {
      // Fee breakdown via FeePaymentItem (has feeTypeId)
      const feeTypes = await db.feeType.findMany({ select: { id: true, name: true } });
      const result = await Promise.all(feeTypes.map(async (ft) => {
        const items = await db.feePaymentItem.aggregate({
          where: {
            feeTypeId: ft.id,
            payment: { paymentDate: { gte: startOfYear, lte: endOfYear } },
          },
          _sum: { amount: true },
          _count: true,
        });
        return {
          name: ft.name, 
          paidAmount: Math.round(Number(items._sum.amount) || 0),
          paidCount: items._count,
        };
      }));
      return NextResponse.json({ type: 'fees', year, feeTypes: result.sort((a, b) => b.paidAmount - a.paidAmount) });
    }

    if (reportType === 'payroll') {
      const payrolls = await db.payroll.findMany({
        where: { createdAt: { gte: startOfYear, lte: endOfYear } },
        select: { netSalary: true, grossSalary: true, allowances: true, deductions: true, monthYear: true, status: true, createdAt: true },
      });
      const byMonth: Record<string, any> = {};
      payrolls.forEach((p) => {
        const m = p.monthYear || new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!byMonth[m]) byMonth[m] = { month: m, gross: 0, net: 0, allowances: 0, deductions: 0, count: 0, paid: 0 };
        byMonth[m].gross += Number(p.grossSalary);
        byMonth[m].net   += Number(p.netSalary);
        const allowancesSum = typeof p.allowances === "string" ? Object.values(JSON.parse(p.allowances||"{}")).reduce((s:any, v:any) => s + Number(v||0), 0) : 0; byMonth[m].allowances += allowancesSum;
        const deductionsSum = typeof p.deductions === "string" ? Object.values(JSON.parse(p.deductions||"{}")).reduce((s:any, v:any) => s + Number(v||0), 0) : 0; byMonth[m].deductions += deductionsSum;
        byMonth[m].count++;
        if (p.status === 'Paid') byMonth[m].paid++;
      });
      return NextResponse.json({ type: 'payroll', year, months: Object.values(byMonth) });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (e: any) {
    console.error('Financial reports error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
