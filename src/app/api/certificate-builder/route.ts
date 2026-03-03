import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const TMPL_KEY = 'cert_tmpl_';
const CERT_KEY = 'cert_issued_';
async function getByPrefix(prefix: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
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
      const students = await prisma.student.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } }, orderBy: { fullName: 'asc' } });
      const staff = await prisma.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
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
    await prisma.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'template' ? TMPL_KEY : CERT_KEY;
    const s = await prisma.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'template' ? TMPL_KEY : CERT_KEY;
    await prisma.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
