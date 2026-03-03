import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const slots = await db.timetableSlot.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
    return NextResponse.json({ success: true, data: slots });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dayOfWeek, periodNumber, startTime, endTime } = body;
    if (!dayOfWeek || !periodNumber || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
    }
    const slot = await db.timetableSlot.upsert({
      where: { dayOfWeek_periodNumber: { dayOfWeek: parseInt(dayOfWeek), periodNumber: parseInt(periodNumber) } },
      create: { dayOfWeek: parseInt(dayOfWeek), periodNumber: parseInt(periodNumber), startTime, endTime },
      update: { startTime, endTime },
    });
    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create slot' }, { status: 500 });
  }
}
