import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.timetable.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Period cleared' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to clear period' }, { status: 500 });
  }
}
