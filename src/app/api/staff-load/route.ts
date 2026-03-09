export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const staff = await db.staff.findMany({
      where: { status: 'active' },
      include: { timetableSlots: { include: { class: true, subject: true } }, department: true },
      orderBy: { firstName: 'asc' },
    });
    const data = staff.map(s => ({ ...s, weeklyPeriods: s.timetableSlots.length }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
