import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const LOG_KEY = 'sms_log_';
const TPL_KEY = 'sms_tpl_';
async function getByPrefix(prefix: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'logs';
    if (view === 'templates') {
      const items = await getByPrefix(TPL_KEY);
      return NextResponse.json({ items });
    }
    let logs = await getByPrefix(LOG_KEY);
    logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    const students = await prisma.student.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, phone: true, fatherPhone: true, motherPhone: true, class: { select: { name: true, id: true } } }, orderBy: { fullName: 'asc' } });
    const staff = await prisma.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: 'asc' } });
    const templates = await getByPrefix(TPL_KEY);
    const summary = { totalSent: logs.reduce((s: number, l: any) => s + (l.recipientCount || 0), 0), totalLogs: logs.length, today: logs.filter((l: any) => l.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length };
    return NextResponse.json({ logs: logs.slice(0, 30), classes, students, staff, templates, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (body.entity === 'template') {
      const item = { id, ...body, createdAt: new Date().toISOString() };
      await prisma.systemSetting.create({ data: { key: TPL_KEY + id, value: JSON.stringify(item) } });
      return NextResponse.json({ item });
    }
    // Log sent SMS
    const item = { id, ...body, status: 'Sent', createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: LOG_KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'template' ? TPL_KEY : LOG_KEY;
    await prisma.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
