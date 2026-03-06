export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp       = request.nextUrl.searchParams;
    const status   = sp.get('status')   || '';
    const priority = sp.get('priority') || '';
    const search   = sp.get('search')   || '';
    const page     = parseInt(sp.get('page')  || '1');
    const limit    = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (status)   where.status   = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { subject:     { contains: search } },
        { description: { contains: search } },
        { complainantId: { contains: search } },
      ];
    }

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      db.complaint.count({ where }),
    ]);

    const statusCounts = await db.complaint.groupBy({
      by: ['status'],
      _count: true,
    });
    const priorityCounts = await db.complaint.groupBy({
      by: ['priority'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        complaints,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        statusCounts:   Object.fromEntries(statusCounts.map(s => [s.status, s._count])),
        priorityCounts: Object.fromEntries(priorityCounts.map(p => [p.priority, p._count])),
      },
    });
  } catch (err) {
    console.error('Complaints GET error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complainantType, complainantId, subject, description, priority, assignedTo } = body;

    if (!complainantType || !subject || !description) {
      return NextResponse.json({ success: false, message: 'complainantType, subject, description required' }, { status: 400 });
    }

    const complaint = await db.complaint.create({
      data: {
        complainantType,
        complainantId: complainantId || 'Unknown',
        subject,
        description,
        priority:   priority   || 'Medium',
        status:     'Open',
        assignedTo: assignedTo || null,
      },
    });

    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  } catch (err) {
    console.error('Complaints POST error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create complaint' }, { status: 500 });
  }
}
