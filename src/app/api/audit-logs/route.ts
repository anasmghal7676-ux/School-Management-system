import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const userId    = sp.get('userId')    || '';
    const tableName = sp.get('tableName') || '';
    const action    = sp.get('action')    || '';
    const fromDate  = sp.get('fromDate');
    const toDate    = sp.get('toDate');
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '50');

    const where: any = {};
    if (userId)    where.userId    = userId;
    if (tableName) where.tableName = tableName;
    if (action)    where.action    = action;
    if (fromDate || toDate) {
      where.timestamp = {};
      if (fromDate) where.timestamp.gte = new Date(fromDate);
      if (toDate)   where.timestamp.lte = new Date(toDate + 'T23:59:59');
    }
    if (search) {
      where.OR = [
        { action:    { contains: search } },
        { tableName: { contains: search } },
        { recordId:  { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true, role: true } } },
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { timestamp: 'desc' },
      }),
      db.auditLog.count({ where }),
    ]);

    // Summary stats
    const actionCounts = await db.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    });

    const tableCounts = await db.auditLog.groupBy({
      by: ['tableName'],
      _count: true,
      orderBy: { _count: { tableName: 'desc' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination:   { page, limit, total, totalPages: Math.ceil(total / limit) },
        actionCounts: actionCounts.map(a => ({ action: a.action, count: a._count })),
        tableCounts:  tableCounts.map(t => ({ table: t.tableName, count: t._count })),
      },
    });
  } catch (error) {
    console.error('Audit logs GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// POST — create an audit log entry (called internally from other APIs)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, tableName, recordId, oldValues, newValues, ipAddress } = body;
    if (!userId || !action || !tableName) {
      return NextResponse.json({ success: false, message: 'userId, action, tableName required' }, { status: 400 });
    }
    const log = await db.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId:  recordId  || null,
        oldValues: oldValues  ? JSON.stringify(oldValues)  : null,
        newValues: newValues  ? JSON.stringify(newValues)  : null,
        ipAddress: ipAddress  || null,
      },
    });
    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create audit log' }, { status: 500 });
  }
}
