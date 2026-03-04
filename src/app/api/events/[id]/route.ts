import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { title, description, eventType, eventDate, startTime, endTime, venue, organizer, isHoliday, targetAudience } = body;
    const event = await db.event.update({
      where: { id: (await params).id },
      data: {
        ...(title          !== undefined && { title }),
        ...(description    !== undefined && { description }),
        ...(eventType      !== undefined && { eventType }),
        ...(eventDate      !== undefined && { eventDate: new Date(eventDate) }),
        ...(startTime      !== undefined && { startTime }),
        ...(endTime        !== undefined && { endTime }),
        ...(venue          !== undefined && { venue }),
        ...(organizer      !== undefined && { organizer }),
        ...(isHoliday      !== undefined && { isHoliday }),
        ...(targetAudience !== undefined && { targetAudience }),
      },
    });
    return NextResponse.json({ success: true, data: event });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.event.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
