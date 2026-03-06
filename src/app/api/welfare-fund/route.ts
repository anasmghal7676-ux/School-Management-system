export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const CONTRIB_KEY = 'welfare_contrib_';
const LOAN_KEY = 'welfare_loan_';
const CONFIG_KEY = 'welfare_config';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'summary';
    const staff = await db.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, designation: true, department: true }, orderBy: { fullName: 'asc' } });
    const configRec = await db.systemSetting.findUnique({ where: { key: CONFIG_KEY } });
    const config = configRec ? JSON.parse(configRec.value) : { monthlyContribution: 500, maxLoanMultiplier: 6, interestRate: 0 };
    if (view === 'loans') {
      const loans = await getByPrefix(LOAN_KEY);
      loans.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const loanSummary = { total: loans.length, active: loans.filter((l: any) => l.status === 'Active').length, pending: loans.filter((l: any) => l.status === 'Pending').length, totalDisbursed: loans.filter((l: any) => l.status !== 'Rejected').reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0) };
      return NextResponse.json({ loans, staff, config, loanSummary });
    }
    const contribs = await getByPrefix(CONTRIB_KEY);
    const loans = await getByPrefix(LOAN_KEY);
    const totalFund = contribs.reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
    const totalDisbursed = loans.filter((l: any) => l.status === 'Active').reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);
    const balance = totalFund - totalDisbursed;
    const staffSummary = staff.map(s => {
      const myContribs = contribs.filter((c: any) => c.staffId === s.id);
      const myLoans = loans.filter((l: any) => l.staffId === s.id && l.status === 'Active');
      return { ...s, totalContributed: myContribs.reduce((t: number, c: any) => t + (Number(c.amount) || 0), 0), activeLoans: myLoans.reduce((t: number, l: any) => t + (Number(l.amount) || 0), 0), contribCount: myContribs.length };
    });
    const fundSummary = { totalFund, totalDisbursed, balance, contributors: staffSummary.filter(s => s.totalContributed > 0).length };
    return NextResponse.json({ contribs, staff, staffSummary, fundSummary, config });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    if (body.entity === 'config') {
      await db.systemSetting.upsert({ where: { key: CONFIG_KEY }, create: { key: CONFIG_KEY, value: JSON.stringify(body.config) }, update: { value: JSON.stringify(body.config) } });
      return NextResponse.json({ ok: true });
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'loan' ? LOAN_KEY : CONTRIB_KEY;
    const refNo = `WF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const item = { id, refNo, ...body, createdAt: new Date().toISOString() };
    if (body.entity === 'loan') item.status = 'Pending';
    await db.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'loan' ? LOAN_KEY : CONTRIB_KEY;
    const s = await db.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'loan' ? LOAN_KEY : CONTRIB_KEY;
    await db.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
