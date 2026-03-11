export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const LOG_KEY = 'sms_log_';
const TPL_KEY = 'sms_tpl_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
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
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, fatherPhone: true, motherPhone: true, guardianPhone: true, class: { select: { name: true, id: true } } }, orderBy: { fullName: 'asc' } });
    const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, phone: true }, orderBy: { fullName: 'asc' } });
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
      await db.systemSetting.create({ data: { settingKey: TPL_KEY + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
      return NextResponse.json({ item });
    }
    // Log sent SMS
    const item = { id, ...body, status: 'Sent', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: LOG_KEY + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'template' ? TPL_KEY : LOG_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
