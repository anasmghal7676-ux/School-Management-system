import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mark single notification as read
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Support bulk mark-read: id can be 'all' with ?userId=...
    if ((await params).id === 'all') {
      const userId = req.nextUrl.searchParams.get('userId');
      if (!userId) return NextResponse.json({ success: false, message: 'userId required for bulk mark-read' }, { status: 400 });
      const result = await db.notification.updateMany({
        where: { userId, isRead: false },
        data:  { isRead: true },
      });
      return NextResponse.json({ success: true, data: { updated: result.count } });
    }

    const updated = await db.notification.update({
      where: { id: (await params).id },
      data:  { isRead: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.notification.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
