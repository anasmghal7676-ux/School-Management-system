export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      title, message, channel, // 'SMS' | 'Email' | 'WhatsApp' | 'In-app'
      targetType,               // 'All-Students' | 'All-Staff' | 'All-Parents' | 'Class' | 'Individual'
      targetClassId,
      targetIds,                // array of student/staff IDs for individual targeting
    } = body;

    if (!title || !message || !channel || !targetType) {
      return NextResponse.json({ success: false, message: 'title, message, channel, targetType required' }, { status: 400 });
    }

    // Resolve recipients
    let recipientCount = 0;
    let recipientIds: string[] = [];

    if (targetType === 'All-Students') {
      const students = await db.student.findMany({ where: { status: 'active' }, select: { id: true } });
      recipientIds   = students.map(s => s.id);
      recipientCount = students.length;
    } else if (targetType === 'All-Staff') {
      const staff    = await db.staff.findMany({ where: { status: 'active' }, select: { id: true } });
      recipientIds   = staff.map(s => s.id);
      recipientCount = staff.length;
    } else if (targetType === 'All-Parents') {
      // Count unique parents
      const parents  = await db.studentParent.findMany({ select: { id: true }, distinct: ['id'] });
      recipientCount = parents.length;
    } else if (targetType === 'Class' && targetClassId) {
      const students = await db.student.findMany({ where: { status: 'active', currentClassId: targetClassId }, select: { id: true } });
      recipientIds   = students.map(s => s.id);
      recipientCount = students.length;
    } else if (targetType === 'Individual' && targetIds?.length) {
      recipientIds   = targetIds;
      recipientCount = targetIds.length;
    }

    if (recipientCount === 0) {
      return NextResponse.json({ success: false, message: 'No recipients found for selected target' }, { status: 400 });
    }

    // Create in-app notifications for student recipients
    const notifData = recipientIds.slice(0, 500).map(userId => ({
      userId,
      title,
      message,
      notificationType: channel || 'In-app',

      isRead: false,
    }));

    let created = 0;
    if (notifData.length > 0) {
      const result = await db.notification.createMany({ data: notifData });
      created      = result.count;
    }

    // In production, this would trigger actual SMS/Email/WhatsApp via configured gateways
    // For now, we log the broadcast and simulate delivery
    return NextResponse.json({
      success: true,
      data: {
        recipientCount,
        notificationsCreated: created,
  
        targetType,
        message: `Broadcast queued for ${recipientCount} recipient(s) via ${channel}`,
        // In production: deliveryId from gateway, estimated time, etc.
        simulatedDelivery: {
          smsQueued:    channel === 'SMS',
          emailQueued:  channel === 'Email',
          whatsAppQueued: channel === 'WhatsApp',
          inAppCreated: created,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Broadcast POST error:', error);
    return NextResponse.json({ success: false, message: 'Broadcast failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    // Get recent broadcast notifications (type=Broadcast)
    const page  = parseInt(request.nextUrl.searchParams.get('page')  || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    // Get unique broadcasts grouped by title+message+createdAt (within 1 min window)
    const notifications = await db.notification.findMany({
      where:   { notificationType: 'Broadcast' },
      orderBy: { createdAt: 'desc' },
      take:    limit * 10, // get more to group
    });

    // Group by title+message within 60s window
    const groups: Record<string, any> = {};
    notifications.forEach(n => {
      const key = `${n.title}||${n.message}`;
      if (!groups[key]) {
        groups[key] = { title: n.title, message: n.message, channel: n.channel, createdAt: n.createdAt, count: 0, readCount: 0 };
      }
      groups[key].count++;
      if (n.isRead) groups[key].readCount++;
    });

    const broadcasts = Object.values(groups)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * limit, page * limit);

    return NextResponse.json({ success: true, data: { broadcasts, total: Object.keys(groups).length } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}
