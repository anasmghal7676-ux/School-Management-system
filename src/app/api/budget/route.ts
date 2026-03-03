import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

async function getBudgets() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: 'budget_head_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.value));
}

async function getTransactions() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: 'budget_txn_' } }, orderBy: { updatedAt: 'desc' } });
  return s.map(x => JSON.parse(x.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const category = searchParams.get('category') || '';

    let budgets = await getBudgets();
    budgets = budgets.filter((b: any) => b.year === year);
    if (category) budgets = budgets.filter((b: any) => b.category === category);

    const txns = await getTransactions();
    const yearTxns = txns.filter((t: any) => t.year === year);

    // Attach spent amount to each budget head
    const budgetsWithSpent = budgets.map((b: any) => {
      const spent = yearTxns.filter((t: any) => t.budgetHeadId === b.id).reduce((s: number, t: any) => s + Number(t.amount), 0);
      return { ...b, spent, remaining: Number(b.allocated) - spent, utilization: b.allocated > 0 ? Math.round((spent / b.allocated) * 100) : 0 };
    });

    const totalAllocated = budgetsWithSpent.reduce((s: number, b: any) => s + Number(b.allocated), 0);
    const totalSpent = budgetsWithSpent.reduce((s: number, b: any) => s + b.spent, 0);

    const categories = [...new Set(budgets.map((b: any) => b.category))];
    const years = [...new Set((await getBudgets()).map((b: any) => b.year))].sort().reverse();

    return NextResponse.json({
      budgets: budgetsWithSpent,
      transactions: yearTxns.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      summary: { totalAllocated, totalSpent, totalRemaining: totalAllocated - totalSpent, utilizationPct: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0, headCount: budgets.length },
      categories,
      years: years.length ? years : [year],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (body.type === 'transaction') {
      const txn = { id, ...body, createdAt: new Date().toISOString() };
      delete txn.type;
      await prisma.systemSetting.create({ data: { key: `budget_txn_${id}`, value: JSON.stringify(txn) } });
      return NextResponse.json({ transaction: txn });
    }

    const budget = { id, ...body, createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: `budget_head_${id}`, value: JSON.stringify(budget) } });
    return NextResponse.json({ budget });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, entityType, ...updates } = body;
    const key = entityType === 'transaction' ? `budget_txn_${id}` : `budget_head_${id}`;
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(setting.value), ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entityType } = await req.json();
    const key = entityType === 'transaction' ? `budget_txn_${id}` : `budget_head_${id}`;
    await prisma.systemSetting.delete({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
