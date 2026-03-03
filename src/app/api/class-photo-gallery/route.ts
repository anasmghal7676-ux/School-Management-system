import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
const ALBUM_KEY = 'gallery_album_';
const PHOTO_KEY = 'gallery_photo_';
async function getByPrefix(prefix: string) {
  const s = await prisma.systemSetting.findMany({ where: { key: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' } });
  return s.map((x: any) => JSON.parse(x.value));
}
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'albums';
    const albumId = searchParams.get('albumId') || '';
    if (view === 'photos') {
      let photos = await getByPrefix(PHOTO_KEY);
      if (albumId) photos = photos.filter((p: any) => p.albumId === albumId);
      photos.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const albums = await getByPrefix(ALBUM_KEY);
      const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ photos, albums, classes });
    }
    const albums = await getByPrefix(ALBUM_KEY);
    const photos = await getByPrefix(PHOTO_KEY);
    const enriched = albums.map((a: any) => ({ ...a, photoCount: photos.filter((p: any) => p.albumId === a.id).length, coverPhoto: photos.find((p: any) => p.albumId === a.id)?.url }));
    enriched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ albums: enriched, classes });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const prefix = body.entity === 'album' ? ALBUM_KEY : PHOTO_KEY;
    const item = { id, ...body, createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({ data: { key: prefix + id, value: JSON.stringify(item) } });
    return NextResponse.json({ item });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, entity, ...updates } = await req.json();
    const prefix = entity === 'album' ? ALBUM_KEY : PHOTO_KEY;
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
    const prefix = entity === 'album' ? ALBUM_KEY : PHOTO_KEY;
    await prisma.systemSetting.delete({ where: { key: prefix + id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
