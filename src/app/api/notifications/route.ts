import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const userId = sp.get('userId') || '';
    const unread = sp.get('unread');
    const type   = sp.get('type')   || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (userId) where.userId = userId;
    if (unread === 'true') where.isRead = false;
    if (type)   where.notificationType = type;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sentDate: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      db.notification.count({ where }),
      userId
        ? db.notification.count({ where: { userId, isRead: false } })
        : db.notification.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,       // single user
      userIds,      // broadcast to multiple
      role,         // broadcast to role (admin/teacher/parent etc.)
      title, message, notificationType, relatedLink,
    } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'title and message are required' }, { status: 400 });
    }

    // Determine target users
    let targetUserIds: string[] = [];
    if (userId) {
      targetUserIds = [userId];
    } else if (userIds && Array.isArray(userIds)) {
      targetUserIds = userIds;
    } else if (role) {
      const users = await db.user.findMany({ where: { role }, select: { id: true } });
      targetUserIds = users.map(u => u.id);
    } else {
      // Broadcast to all users
      const users = await db.user.findMany({ select: { id: true }, take: 500 });
      targetUserIds = users.map(u => u.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No target users found' }, { status: 400 });
    }

    // Create notifications in batch
    const notifications = await db.notification.createMany({
      data: targetUserIds.map(uid => ({
        userId:           uid,
        title,
        message,
        notificationType: notificationType || 'In-app',
        relatedLink:      relatedLink || null,
        isRead:           false,
      })),
    });

    return NextResponse.json({
      success: true,
      data: { count: notifications.count },
      message: `Notification sent to ${notifications.count} user(s)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create notification' }, { status: 500 });
  }
}
