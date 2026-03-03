import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'staff_transfer_';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.staffName?.toLowerCase().includes(s) || i.employeeCode?.toLowerCase().includes(s)); }
    if (status) items = items.filter((i: any) => i.status === status);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const staff = await prisma.staff.findMany({ where: { status: 'Active' }, select: { id: true, fullName: true, employeeCode: true, designation: true, department: true, basicSalary: true }, orderBy: { fullName: 'asc' } });
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ items: items.slice((page-1)*limit, page*limit), total: items.length, staff, departments });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const item = { id, ...body, status: body.status || 'Pending', createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    if (body.status === 'Approved' && body.staffId) {
      await prisma.staff.update({ where: { id: body.staffId }, data: { department: body.toDepartment || undefined, designation: body.toDesignation || undefined } }).catch(() => {});
    }
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = JSON.parse(s.value);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: KEY + id }, data: { value: JSON.stringify(updated) } });
    if (updates.status === 'Approved' && existing.staffId) {
      await prisma.staff.update({ where: { id: existing.staffId }, data: { department: existing.toDepartment || undefined, designation: existing.toDesignation || undefined } }).catch(() => {});
    }
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
