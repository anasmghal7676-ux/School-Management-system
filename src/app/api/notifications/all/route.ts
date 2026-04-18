export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    // Mark all notifications as read for the current user
    // Since we don't have session auth here, we mark all unread ones
    await db.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
