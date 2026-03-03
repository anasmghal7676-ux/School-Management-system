import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Chart of Accounts - stored as expenses with category grouping
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';

    // Get expense categories as accounts
    const categories = await db.expenseCategory.findMany({
      include: {
        expenses: {
          select: { amount: true, date: true },
          where: type ? {} : {},
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    const accounts = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      code: `ACC-${cat.id.slice(0, 4).toUpperCase()}`,
      type: cat.name.toLowerCase().includes('income') || cat.name.toLowerCase().includes('fee') ? 'Income' : 'Expense',
      balance: cat.expenses.reduce((s: number, e: any) => s + Number(e.amount), 0),
      transactions: cat.expenses.length,
      recentTransactions: cat.expenses,
    }));

    const summary = {
      totalAccounts: accounts.length,
      totalIncome: accounts.filter(a => a.type === 'Income').reduce((s, a) => s + a.balance, 0),
      totalExpense: accounts.filter(a => a.type === 'Expense').reduce((s, a) => s + a.balance, 0),
    };

    return NextResponse.json({ success: true, data: accounts, summary });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
