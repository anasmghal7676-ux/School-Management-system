export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const KEY_PREFIX = 'hostel_att:';

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = req.nextUrl.searchParams;
    const page = parseInt(sp.get('page') || '1');
    const limit = Math.min(parseInt(sp.get('limit') || '20'), 200);
    const search = sp.get('search') || '';
    
    const all = await db.systemSetting.findMany({
      where: { settingKey: { startsWith: KEY_PREFIX } },
      orderBy: { updatedAt: 'desc' },
    });
    
    const items = all.map(s => ({ id: s.key.replace(KEY_PREFIX, ''), ...JSON.parse(s.settingValue) }));
    const filtered = search ? items.filter((i: any) => JSON.stringify(i).toLowerCase().includes(search.toLowerCase())) : items;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    
    return NextResponse.json({ success: true, data: paginated, pagination: { total: filtered.length, page, limit } });
  } catch (e: any) {
    return NextResponse.json({ success: false, data: [], error: e.message });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const id = Date.now().toString();
    await db.systemSetting.create({ data: { settingKey: KEY_PREFIX + id, settingValue: JSON.stringify({ ...body, id, createdAt: new Date().toISOString(), schoolId: process.env.SCHOOL_ID || 'school_main', settingType: 'General' }) } });
    return NextResponse.json({ success: true, data: { id, ...body } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY_PREFIX + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY_PREFIX + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
 return PATCH(req); }

export async function DELETE(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = req.nextUrl.searchParams;
    const id = sp.get('id') || (await req.json().catch(() => ({}))).id;
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: process.env.SCHOOL_ID || 'school_main', settingKey: KEY_PREFIX + id } } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
