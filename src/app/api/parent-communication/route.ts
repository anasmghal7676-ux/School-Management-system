export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'parent_comm_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 200);
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.subject?.toLowerCase().includes(s) || i.message?.toLowerCase().includes(s)); }
    if (type) items = items.filter((i: any) => i.type === type);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const parents = await db.studentParent.findMany({ take: 200, include: { student: { select: { fullName: true, admissionNumber: true, class: { select: { name: true } } } } }, orderBy: { firstName: 'asc' } });
    const summary = { total: items.length, general: items.filter((i: any) => i.type === 'General').length, urgent: items.filter((i: any) => i.type === 'Urgent').length, fee: items.filter((i: any) => i.type === 'Fee Reminder').length };
    return NextResponse.json({ items: items.slice((page-1)*limit, page*limit), total: items.length, summary, classes, parents });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    let recipientCount = 0;
    if (body.audience === 'All Parents') {
      recipientCount = await db.studentParent.count();
    } else if (body.audience === 'Class') {
      recipientCount = await db.studentParent.count({ where: { student: { currentClassId: body.classId } } });
    } else {
      recipientCount = body.selectedParents?.length || 0;
    }
    const item = { id, ...body, recipientCount, status: 'Sent', sentAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: KEY + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
