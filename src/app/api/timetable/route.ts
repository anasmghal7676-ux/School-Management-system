export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const limit = parseInt(sp.get('limit') || '200');
    const where: any = {};
    if (classId) where.classId = classId;
    const slots = await db.timetableSlot.findMany({
      where,
      include: { class: true, subject: true, teacher: true, section: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      take: limit,
    });
    return NextResponse.json({ success: true, data: slots });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.classId || !body.dayOfWeek || !body.startTime || !body.endTime) {
      return NextResponse.json({ success: false, error: 'classId, dayOfWeek, startTime, endTime required' }, { status: 400 });
    }
    const slot = await db.timetableSlot.create({
      data: {
        classId: body.classId,
        dayOfWeek: parseInt(body.dayOfWeek),
        startTime: body.startTime,
        endTime: body.endTime,
        subjectId: body.subjectId || null,
        teacherId: body.teacherId || null,
        sectionId: body.sectionId || null,
        room: body.room || null,
      },
      include: { class: true, subject: true, teacher: true },
    });
    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
