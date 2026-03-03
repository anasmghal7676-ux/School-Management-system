import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

async function getAssets() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'asset_entry_' } },
    orderBy: { updatedAt: 'desc' },
  });
  return settings.map(s => JSON.parse(s.value));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let assets = await getAssets();

    if (search) {
      const s = search.toLowerCase();
      assets = assets.filter((a: any) =>
        a.name?.toLowerCase().includes(s) ||
        a.assetCode?.toLowerCase().includes(s) ||
        a.brand?.toLowerCase().includes(s) ||
        a.location?.toLowerCase().includes(s)
      );
    }
    if (category) assets = assets.filter((a: any) => a.category === category);
    if (status) assets = assets.filter((a: any) => a.status === status);
    if (location) assets = assets.filter((a: any) => a.location === location);

    assets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = assets.length;
    const paginated = assets.slice((page - 1) * limit, page * limit);

    const all = await getAssets();
    const summary = {
      total: all.length,
      active: all.filter((a: any) => a.status === 'Active').length,
      maintenance: all.filter((a: any) => a.status === 'Under Maintenance').length,
      disposed: all.filter((a: any) => a.status === 'Disposed').length,
      totalValue: all.reduce((s: number, a: any) => s + (Number(a.purchasePrice) || 0), 0),
    };

    return NextResponse.json({ assets: paginated, total, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    // Generate asset code
    const prefix = (body.category || 'AST').slice(0, 3).toUpperCase();
    const assetCode = `${prefix}-${Date.now().toString().slice(-6)}`;
    const asset = { id, assetCode, ...body, createdAt: new Date().toISOString() };
    await prisma.systemSetting.create({
      data: { key: `asset_entry_${id}`, value: JSON.stringify(asset) },
    });
    return NextResponse.json({ asset });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    const setting = await prisma.systemSetting.findUnique({ where: { key: `asset_entry_${id}` } });
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = JSON.parse(setting.value);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await prisma.systemSetting.update({ where: { key: `asset_entry_${id}` }, data: { value: JSON.stringify(updated) } });
    return NextResponse.json({ asset: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.systemSetting.delete({ where: { key: `asset_entry_${id}` } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
