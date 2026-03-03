import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'default-school';

export async function GET(request: NextRequest) {
  try {
    const sp      = request.nextUrl.searchParams;
    const status  = sp.get('status')  || '';
    const search  = sp.get('search')  || '';
    const date    = sp.get('date')    || '';
    const page    = parseInt(sp.get('page')  || '1');
    const limit   = parseInt(sp.get('limit') || '25');

    const where: any = { schoolId: SCHOOL_ID };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { visitorName:  { contains: search, mode: 'insensitive' } },
        { personToMeet: { contains: search, mode: 'insensitive' } },
        { visitorPhone: { contains: search, mode: 'insensitive' } },
        { purpose:      { contains: search, mode: 'insensitive' } },
      ];
    }
    if (date) {
      const start = new Date(date);
      const end   = new Date(date);
      end.setDate(end.getDate() + 1);
      where.checkIn = { gte: start, lt: end };
    }

    const [visitors, total] = await Promise.all([
      (db as any).visitorLog.findMany({
        where,
        orderBy: { checkIn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (db as any).visitorLog.count({ where }),
    ]);

    // Summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount, checkedIn, totalVisitors] = await Promise.all([
      (db as any).visitorLog.count({ where: { schoolId: SCHOOL_ID, checkIn: { gte: today, lt: tomorrow } } }),
      (db as any).visitorLog.count({ where: { schoolId: SCHOOL_ID, status: 'Checked-In' } }),
      (db as any).visitorLog.count({ where: { schoolId: SCHOOL_ID } }),
    ]);

    const purposeBreakdown = await (db as any).visitorLog.groupBy({
      by: ['purpose'],
      _count: { purpose: true },
      where: { schoolId: SCHOOL_ID },
      orderBy: { _count: { purpose: 'desc' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        visitors,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { todayCount, checkedIn, totalVisitors, purposeBreakdown },
      },
    });
  } catch (error) {
    console.error('Visitors GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch visitors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorName, purpose, personToMeet } = body;

    if (!visitorName || !purpose || !personToMeet) {
      return NextResponse.json(
        { success: false, message: 'visitorName, purpose, and personToMeet are required' },
        { status: 400 }
      );
    }

    const visitor = await (db as any).visitorLog.create({
      data: {
        schoolId:       SCHOOL_ID,
        visitorName:    body.visitorName,
        visitorPhone:   body.visitorPhone   || null,
        visitorCnic:    body.visitorCnic    || null,
        purpose:        body.purpose,
        personToMeet:   body.personToMeet,
        personToMeetId: body.personToMeetId || null,
        checkIn:        body.checkIn ? new Date(body.checkIn) : new Date(),
        vehicleNo:      body.vehicleNo      || null,
        idType:         body.idType         || null,
        idNumber:       body.idNumber       || null,
        remarks:        body.remarks        || null,
        badgeNumber:    body.badgeNumber    || null,
        status:         'Checked-In',
      },
    });

    return NextResponse.json({ success: true, data: visitor }, { status: 201 });
  } catch (error) {
    console.error('Visitors POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to log visitor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const data: any = { ...updates };

    // Checkout action
    if (action === 'checkout') {
      data.status   = 'Checked-Out';
      data.checkOut = new Date();
    }

    const visitor = await (db as any).visitorLog.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: visitor });
  } catch (error) {
    console.error('Visitors PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update visitor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await (db as any).visitorLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visitors DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete record' }, { status: 500 });
  }
}
