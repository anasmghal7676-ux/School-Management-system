export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
const KEY = 'cctv_log_';
const CAM_KEY = 'cctv_cam_';
async function getLogs() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: KEY } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
async function getCams() {
  const s = await db.systemSetting.findMany({ where: { key: { startsWith: CAM_KEY } } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const entity = searchParams.get('entity') || 'logs';
    if (entity === 'cameras') return NextResponse.json({ items: await getCams() });
    let items = await getLogs();
    if (search) { const s = search.toLowerCase(); items = items.filter((i: any) => i.description?.toLowerCase().includes(s) || i.location?.toLowerCase().includes(s)); }
    if (type) items = items.filter((i: any) => i.incidentType === type);
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const cameras = await getCams();
    const summary = { total: items.length, unresolved: items.filter((i: any) => i.status !== 'Resolved').length, cameras: cameras.length, activeCams: cameras.filter((c: any) => c.status === 'Active').length };
    return NextResponse.json({ items: items.slice(0, 50), total: items.length, summary, cameras });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'camera' ? CAM_KEY : KEY;
    const item = { id, ...body, status: body.entity === 'camera' ? 'Active' : 'Open', createdAt: new Date().toISOString() };
    await db.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'camera' ? CAM_KEY : KEY;
    const s = await db.systemSetting.findUnique({ where: { key: prefix + id } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = { ...JSON.parse(s.value), ...updates, updatedAt: new Date().toISOString() };
    await db.systemSetting.update({ where: { key: prefix + id }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ item: updated });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity } = await req.json();
    const prefix = entity === 'camera' ? CAM_KEY : KEY;
    await db.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
