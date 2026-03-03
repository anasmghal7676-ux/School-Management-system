import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'online_adm_';
async function getAll() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const applyingClass = searchParams.get('class') || '';
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.applicantName?.toLowerCase().includes(s) || i.applicationNo?.toLowerCase().includes(s) || i.fatherName?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    if (applyingClass) items = items.filter((i: any) => i.applyingClass === applyingClass);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    const summary = {
      total: items.length,
      pending: items.filter((i: any) => i.status === 'Pending').length,
      shortlisted: items.filter((i: any) => i.status === 'Shortlisted').length,
      admitted: items.filter((i: any) => i.status === 'Admitted').length,
      rejected: items.filter((i: any) => i.status === 'Rejected').length,
    };
    return NextResponse.json({ items, classes, summary });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const appNo = `ADM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const item = { id, applicationNo: appNo, ...body, status: 'Pending', createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    if (updates.status) updated.statusChangedAt = new Date().toISOString();
    await prisma.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.systemSetting.delete({ where: { key: KEY + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
