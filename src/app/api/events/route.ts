import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp       = request.nextUrl.searchParams;
    const month    = sp.get('month');     // YYYY-MM
    const type     = sp.get('type') || '';
    const upcoming = sp.get('upcoming') === 'true';
    const page     = parseInt(sp.get('page')  || '1');
    const limit    = parseInt(sp.get('limit') || '30');

    const where: any = {};
    if (type) where.eventType = type;

    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.eventDate = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      };
    } else if (upcoming) {
      where.eventDate = { gte: new Date() };
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { eventDate: 'asc' },
      }),
      db.event.count({ where }),
    ]);

    // Upcoming 5 events for quick widget
    const upcoming5 = await db.event.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: { events, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, upcoming5 },
    });
  } catch (err) {
    console.error('Events GET error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolId, title, description, eventType, eventDate,
      startTime, endTime, venue, organizer, isHoliday, targetAudience,
    } = body;

    if (!title || !eventDate || !eventType) {
      return NextResponse.json({ success: false, message: 'title, eventDate, eventType required' }, { status: 400 });
    }

    const event = await db.event.create({
      data: {
        schoolId:       schoolId       || 'default',
        title,
        description:    description    || null,
        eventType,
        eventDate:      new Date(eventDate),
        startTime:      startTime      || null,
        endTime:        endTime        || null,
        venue:          venue          || null,
        organizer:      organizer      || null,
        isHoliday:      isHoliday      ?? false,
        targetAudience: targetAudience || 'All',
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    console.error('Events POST error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create event' }, { status: 500 });
  }
}
