export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.visitorLog.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.checkOutTime !== undefined) data.checkOut = new Date(body.checkOutTime);
    if (body.status !== undefined) data.status = body.status;
    if (body.purpose !== undefined) data.purpose = body.purpose;
    if (body.hostName !== undefined) data.hostName = body.hostName;
    // Auto checkout
    if (body.checkOutTime || body.status === 'Checked-Out') data.status = 'Checked-Out';
    const updated = await db.visitorLog.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.visitorLog.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
