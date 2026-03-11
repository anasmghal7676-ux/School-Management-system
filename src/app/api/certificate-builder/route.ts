export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const TMPL_KEY = 'cert_tmpl_';
const CERT_KEY = 'cert_issued_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'templates';
    if (view === 'issued') {
      let issued = await getByPrefix(CERT_KEY);
      issued.sort((a: any, b: any) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
      const templates = await getByPrefix(TMPL_KEY);
      const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
      const staff = await db.staff.findMany({ where: { status: 'active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
      return NextResponse.json({ issued, templates, students, staff });
    }
    const templates = await getByPrefix(TMPL_KEY);
    return NextResponse.json({ templates });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'template' ? TMPL_KEY : CERT_KEY;
    const certNo = body.entity !== 'template' ? `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}` : undefined;
    const item = { id, ...(certNo && { certNo }), ...body, issuedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: prefix + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'template' ? TMPL_KEY : CERT_KEY;
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'template' ? TMPL_KEY : CERT_KEY;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: prefix + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
