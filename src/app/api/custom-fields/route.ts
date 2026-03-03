import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const KEY = 'custom_field_';
const VAL_KEY = 'custom_field_val_';
async function getByPrefix(prefix: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: prefix } } });
  return s.map((x: any) => JSON.parse(x.value));
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
      await prisma.systemSetting.upsert({ where: { key: vKey }, create: { key: vKey, value: JSON.stringify(item) }, update: { value: JSON.stringify(item) } });
      return NextResponse.json({ ok: true });
    }
    const all = await getByPrefix(KEY);
    const item = { id, ...body, order: all.filter((f: any) => f.entity === body.entity).length + 1, createdAt: new Date().toISOString() };
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
