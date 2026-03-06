export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const ann = await db.announcement.update({
      where: { id: (await params).id },
      data: {
        ...(body.title            !== undefined && { title: body.title }),
        ...(body.message          !== undefined && { message: body.message }),
        ...(body.announcementType !== undefined && { announcementType: body.announcementType }),
        ...(body.targetAudience   !== undefined && { targetAudience: body.targetAudience }),
        ...(body.expiryDate       !== undefined && { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null }),
        ...(body.isActive         !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json({ success: true, data: ann });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.announcement.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
