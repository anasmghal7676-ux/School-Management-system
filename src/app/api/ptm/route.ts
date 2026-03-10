export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  try {
    const sp    = request.nextUrl.searchParams;
    const status = sp.get('status') || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = parseInt(sp.get('limit') || '20');

    const where: any = { schoolId: SCHOOL_ID };
    if (status) where.status = status;

    const [meetings, total] = await Promise.all([
      (db as any).parentTeacherMeeting.findMany({
        where,
        orderBy: { meetingDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { appointments: true } },
        },
      }),
      (db as any).parentTeacherMeeting.count({ where }),
    ]);

    // Summary
    const [scheduled, completed, upcoming] = await Promise.all([
      (db as any).parentTeacherMeeting.count({ where: { schoolId: SCHOOL_ID, status: 'Scheduled' } }),
      (db as any).parentTeacherMeeting.count({ where: { schoolId: SCHOOL_ID, status: 'Completed' } }),
      (db as any).parentTeacherMeeting.count({
        where: { schoolId: SCHOOL_ID, meetingDate: { gte: new Date() } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        meetings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { scheduled, completed, upcoming },
      },
    });
  } catch (error) {
    console.error('PTM GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch PTM data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.meetingDate || !body.startTime) {
      return NextResponse.json(
        { success: false, message: 'title, meetingDate, and startTime are required' },
        { status: 400 }
      );
    }

    const meeting = await (db as any).parentTeacherMeeting.create({
      data: {
        schoolId:    SCHOOL_ID,
        title:       body.title,
        meetingDate: new Date(body.meetingDate),
        startTime:   body.startTime,
        endTime:     body.endTime    || '',
        venue:       body.venue      || null,
        description: body.description || null,
        slots:       body.slots      || 10,
        slotDuration: body.slotDuration || 10,
        classId:     body.classId    || null,
        status:      'Scheduled',
      },
    });

    return NextResponse.json({ success: true, data: meeting }, { status: 201 });
  } catch (error) {
    console.error('PTM POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create PTM' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const data: any = {};
    if (updates.title       !== undefined) data.title       = updates.title;
    if (updates.status      !== undefined) data.status      = updates.status;
    if (updates.venue       !== undefined) data.venue       = updates.venue;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.meetingDate !== undefined) data.meetingDate = new Date(updates.meetingDate);

    const meeting = await (db as any).parentTeacherMeeting.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    console.error('PTM PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await (db as any).parentTeacherMeeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PTM DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
