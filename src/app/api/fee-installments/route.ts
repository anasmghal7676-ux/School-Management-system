export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const PLAN_KEY = 'fee_install_plan_';
const PAY_KEY = 'fee_install_pay_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'payments';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    if (view === 'plans') {
      let items = await getByPrefix(PLAN_KEY);
      if (search) { const s = search.toLowerCase(); items = items.filter((p: any) => p.planName?.toLowerCase().includes(s)); }
      const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ items, classes });
    }
    let payments = await getByPrefix(PAY_KEY);
    if (search) { const s = search.toLowerCase(); payments = payments.filter((p: any) => p.studentName?.toLowerCase().includes(s)); }
    const today = new Date().toISOString().slice(0, 10);
    payments = payments.map((p: any) => ({ ...p, isOverdue: p.status === 'Pending' && p.dueDate < today }));
    if (status === 'overdue') payments = payments.filter((p: any) => p.isOverdue);
    else if (status) payments = payments.filter((p: any) => p.status === status);
    payments.sort((a: any, b: any) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const summary = {
      total: payments.length,
      paid: payments.filter((p: any) => p.status === 'Paid').length,
      pending: payments.filter((p: any) => p.status === 'Pending' && !p.isOverdue).length,
      overdue: payments.filter((p: any) => p.isOverdue).length,
      collected: payments.filter((p: any) => p.status === 'Paid').reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
      outstanding: payments.filter((p: any) => p.status === 'Pending').reduce((s: number, p: any) => s + Number(p.amount || 0), 0),
    };
    const students = await db.student.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
    const plans = await getByPrefix(PLAN_KEY);
    return NextResponse.json({ items: payments.slice(0, 60), total: payments.length, summary, students, plans });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (body.entity === 'plan') {
      const item = { id, ...body, isActive: true, createdAt: new Date().toISOString() };
      await db.systemSetting.create({ data: { key: PLAN_KEY + id, value: JSON.stringify(item) } });
      return NextResponse.json({ item });
    }
    const { studentId, studentName, planId, planName, className, startDate, totalAmount, installments } = body;
    const perInstall = Math.round((Number(totalAmount) || 0) / (Number(installments) || 0));
    const created = [] as any[];
    for (let i = 0; i < (Number(installments) || 0); i++) {
      const due = new Date(startDate);
      due.setMonth(due.getMonth() + i);
      const pid = `${Date.now()}${i}_${Math.random().toString(36).slice(2,4)}`;
      const isLast = i === (Number(installments) || 0) - 1;
      const payment = { id: pid, studentId, studentName, planId, planName, className, installmentNumber: i + 1, totalInstallments: (Number(installments) || 0), amount: isLast ? (Number(totalAmount) || 0) - perInstall * ((Number(installments) || 0) - 1) : perInstall, dueDate: due.toISOString().slice(0, 10), status: 'Pending', createdAt: new Date().toISOString() };
      await db.systemSetting.create({ data: { key: PAY_KEY + pid, value: JSON.stringify(payment) } });
      created.push(payment);
    }
    return NextResponse.json({ items: created });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'plan' ? PLAN_KEY : PAY_KEY;
    const s = await db.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === 'Paid') updated.paidAt = new Date().toISOString();
    await db.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    await db.systemSetting.delete({ where: { key: (entity === 'plan' ? PLAN_KEY : PAY_KEY) + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
