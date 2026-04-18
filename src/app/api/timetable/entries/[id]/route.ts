export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.timetable.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Period cleared' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to clear period' }, { status: 500 });
  }
}
