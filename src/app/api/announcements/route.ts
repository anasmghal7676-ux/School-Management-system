export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const active = sp.get('active');
    const type   = sp.get('type') || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (type) where.announcementType = type;
    if (active === 'true') {
      where.isActive = true;
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ];
    }

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ publishedDate: 'desc' }],
      }),
      db.announcement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { announcements, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    console.error('Announcements GET error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolId, title, message, announcementType, targetAudience,
      targetClassId, publishedDate, expiryDate, createdBy,
    } = body;

    if (!title || !message || !announcementType) {
      return NextResponse.json({ success: false, message: 'title, message, announcementType required' }, { status: 400 });
    }

    const ann = await db.announcement.create({
      data: {
        schoolId:         schoolId         || 'default',
        title,
        message,
        announcementType,
        targetAudience:   targetAudience   || 'All',
        targetClassId:    targetClassId    || null,
        publishedDate:    publishedDate    ? new Date(publishedDate) : new Date(),
        expiryDate:       expiryDate       ? new Date(expiryDate)   : null,
        isActive:         true,
        createdBy:        createdBy        || null,
      },
    });

    return NextResponse.json({ success: true, data: ann }, { status: 201 });
  } catch (err) {
    console.error('Announcements POST error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create announcement' }, { status: 500 });
  }
}
