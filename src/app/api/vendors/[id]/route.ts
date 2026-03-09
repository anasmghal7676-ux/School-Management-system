export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await (db as any).vendor.update({ where: { id }, data: {
      name: body.name || undefined, contactPerson: body.contactPerson ?? undefined,
      phone: body.phone ?? undefined, email: body.email ?? undefined,
      address: body.address ?? undefined, category: body.category ?? undefined,
      status: body.status || undefined,
    }});
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { return PATCH(req, { params }); }
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await (db as any).vendor.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
