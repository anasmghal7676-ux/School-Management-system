export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/timetable-slots — returns all 48 pre-seeded slots (6 days × 8 periods)
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const slots = await db.timetableSlot.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
    return NextResponse.json({ success: true, data: slots });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
