export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// Ledger: aggregates FeePayments (income) + Expenses (outgoing) into a unified journal
// GET /api/accounting/ledger?fromDate=&toDate=&type=income|expense|all&page=
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const fromDate = sp.get('fromDate');
    const toDate   = sp.get('toDate');
    const type     = sp.get('type') || 'all';   // income | expense | all
    const page     = parseInt(sp.get('page')  || '1');
    const limit    = Math.min(parseInt(sp.get('limit') || '30'), 200);

    const dateFrom = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo   = toDate   ? new Date(toDate + 'T23:59:59') : new Date();

    // Fetch income (fee payments)
    const incomeEntries: any[] = [];
    if (type === 'all' || type === 'income') {
      const payments = await db.feePayment.findMany({
        where: { paymentDate: { gte: dateFrom, lte: dateTo }, status: 'Success' },
        include: { student: { select: { fullName: true, admissionNumber: true } } },
        orderBy: { paymentDate: 'desc' },
      });
      payments.forEach(p => {
        incomeEntries.push({
          id:          p.id,
          date:        p.paymentDate,
          type:        'income',
          category:    'Fee Collection',
          description: `Fee from ${p.student?.fullName || 'Unknown'} (${p.student?.admissionNumber || ''}) — ${p.monthYear || 'One-time'}`,
          reference:   p.receiptNumber,
          amount:      p.paidAmount,
          mode:        p.paymentMode,
        });
      });
    }

    // Fetch expenses
    const expenseEntries: any[] = [];
    if (type === 'all' || type === 'expense') {
      const expenses = await db.expense.findMany({
        where: { expenseDate: { gte: dateFrom, lte: dateTo } },
        include: { expenseCategory: { select: { name: true } } },
        orderBy: { expenseDate: 'desc' },
      });
      expenses.forEach(e => {
        expenseEntries.push({
          id:          e.id,
          date:        e.expenseDate,
          type:        'expense',
          category:    e.expenseCategory?.name || 'Expense',
          description: e.description || e.vendorName || 'Expense',
          reference:   e.billNumber,
          amount:      e.amount,
          mode:        e.paymentMode,
        });
      });
    }

    // Merge & sort by date desc
    const all = [...incomeEntries, ...expenseEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total      = all.length;
    const paginated  = all.slice((page - 1) * limit, page * limit);

    // Totals
    const totalIncome  = incomeEntries.reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenseEntries.reduce((s, e) => s + e.amount, 0);
    const netBalance   = totalIncome - totalExpense;

    // Monthly breakdown for chart
    const monthly: Record<string, { income: number; expense: number }> = {};
    [...incomeEntries, ...expenseEntries].forEach(e => {
      const key = new Date(e.date).toISOString().slice(0, 7);
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0 };
      if (e.type === 'income')  monthly[key].income  += e.amount;
      if (e.type === 'expense') monthly[key].expense += e.amount;
    });
    const monthlyChart = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v, net: v.income - v.expense }));

    return NextResponse.json({
      success: true,
      data: {
        entries:    paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary:    { totalIncome, totalExpense, netBalance },
        monthlyChart,
        dateRange:  { from: dateFrom, to: dateTo },
      },
    });
  } catch (error) {
    console.error('Ledger GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch ledger' }, { status: 500 });
  }
}
