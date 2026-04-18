export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'tc_issuance_entry_';
async function getAll() {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 200);
    let items = await getAll();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.studentName?.toLowerCase().includes(s) || i.admissionNo?.toLowerCase().includes(s) || i.tcNumber?.toLowerCase().includes(s)); }
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    // Get last TC number for auto-increment
    const tcNumbers = items.map((i: any) => parseInt(i.tcNumber?.replace(/\D/g, '') || '0')).filter(Boolean);
    const nextTcNum = tcNumbers.length > 0 ? Math.max(...tcNumbers) + 1 : 1;
    const students = await db.student.findMany({ where: { status: 'active' }, include: { class: true, section: true }, orderBy: { fullName: 'asc' } });
    const schoolSettings = await db.systemSetting.findFirst({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: 'school_info' } } });
    const school = schoolSettings ? JSON.parse(schoolSettings.settingValue) : { name: 'School Name', address: '', principal: '' };
    return NextResponse.json({ items: items.slice((page-1)*limit, page*limit), total, students, school, nextTcNum });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const item = { id, ...body, issuedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: KEY + id, settingValue: JSON.stringify(item), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' } });
    // Update student status to Left if requested
    if (body.markAsLeft && body.studentId) {
      await db.student.update({ where: { id: body.studentId }, data: { status: 'Left' } });
    }
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
