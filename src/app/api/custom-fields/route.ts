export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'custom_field_';
const VAL_KEY = 'custom_field_val_';
async function getByPrefix(prefix: string) {
  const s = await db.systemSetting.findMany({ where: { settingKey: { startsWith: prefix } } });
  return s.map((x: any) => JSON.parse(x.settingValue));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity') || 'student'; // student | staff
    const targetId = searchParams.get('targetId') || '';
    const fields = (await getByPrefix(KEY)).filter((f: any) => f.entity === entity);
    fields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    if (targetId) {
      const values = (await getByPrefix(VAL_KEY)).filter((v: any) => v.targetId === targetId);
      const merged = fields.map((f: any) => ({ ...f, value: values.find((v: any) => v.fieldId === f.id)?.value || '' }));
      return NextResponse.json({ fields: merged });
    }
    return NextResponse.json({ fields });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (body.action === 'save_value') {
      // Upsert field value
      const vKey = `${VAL_KEY}${body.targetId}_${body.fieldId}`;
      const item = { id, targetId: body.targetId, fieldId: body.fieldId, value: body.value, updatedAt: new Date().toISOString() };
      await db.systemSetting.upsert({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: vKey } }, create: { settingKey: vKey, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' }, update: { settingValue: JSON.stringify(item) } });
      return NextResponse.json({ ok: true });
    }
    const all = await getByPrefix(KEY);
    const item = { id, ...body, order: all.filter((f: any) => f.entity === body.entity).length + 1, createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { settingKey: KEY + id, settingValue: JSON.stringify(item), schoolId: 'school_main', settingType: 'General' } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...updates } = await req.json();
    const s = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: KEY + id } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.settingValue), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: KEY + id } }, data: { settingValue: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.systemSetting.delete({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: KEY + id } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
