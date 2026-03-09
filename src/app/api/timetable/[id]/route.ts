export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.timetableSlot.findUnique({ where: { id }, include: { class: true, subject: true, teacher: true } });
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.timetableSlot.update({
      where: { id },
      data: {
        dayOfWeek: body.dayOfWeek !== undefined ? parseInt(body.dayOfWeek) : undefined,
        startTime: body.startTime || undefined,
        endTime: body.endTime || undefined,
        subjectId: body.subjectId ?? undefined,
        teacherId: body.teacherId ?? undefined,
        room: body.room ?? undefined,
      },
      include: { class: true, subject: true, teacher: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.timetableSlot.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
