import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'tc_issuance_entry_';
async function getAll() {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s) || i.admissionNo?.toLowerCase().includes(s) || i.tcNumber?.toLowerCase().includes(s)); }
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    // Get last TC number for auto-increment
    const tcNumbers = items.map((i: any) => parseInt(i.tcNumber?.replace(/\D/g, '') || '0')).filter(Boolean);
    const nextTcNum = tcNumbers.length > 0 ? Math.max(...tcNumbers) + 1 : 1;
    const students = await prisma.student.findMany({ where: { status: 'Active' }, include: { class: true, section: true }, orderBy: { fullName: 'asc' } });
    const schoolSettings = await prisma.systemSetting.findFirst({ where: { key: 'school_info' } });
    const school = schoolSettings ? JSON.parse(schoolSettings.value) : { name: 'School Name', address: '', principal: '' };
    return NextResponse.json({ items: items.slice((page-1)*limit, page*limit), total, students, school, nextTcNum });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const item = { id, ...body, issuedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: KEY + id, value: JSON.stringify(item) } });
    // Update student status to Left if requested
    if (body.markAsLeft && body.studentId) {
      await prisma.student.update({ where: { id: body.studentId }, data: { status: 'Left' } });
    }
    return NextResponse.json({ item });
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
