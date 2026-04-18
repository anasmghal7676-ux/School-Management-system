export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const type      = sp.get('type')      || '';
    const classId   = sp.get('classId')   || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (studentId) where.studentId    = studentId;
    if (type)      where.incidentType = type;
    if (classId) {
      where.student = { currentClassId: classId };
    }

    const [logs, total] = await Promise.all([
      db.studentBehaviorLog.findMany({
        where,
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { incidentDate: 'desc' },
      }),
      db.studentBehaviorLog.count({ where }),
    ]);

    const typeCounts = await db.studentBehaviorLog.groupBy({
      by: ['incidentType'],
      _count: true,
      ...(studentId ? { where: { studentId } } : {}),
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination:  { page, limit, total, totalPages: Math.ceil(total / limit) },
        typeCounts:  Object.fromEntries(typeCounts.map(t => [t.incidentType, t._count])),
      },
    });
  } catch (err) {
    console.error('Behavior logs GET error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { studentId, incidentDate, incidentType, description, actionTaken, reportedBy } = body;

    if (!studentId || !incidentType || !description || !reportedBy) {
      return NextResponse.json({ success: false, message: 'studentId, incidentType, description, reportedBy required' }, { status: 400 });
    }

    const log = await db.studentBehaviorLog.create({
      data: {
        studentId,
        incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
        incidentType,
        description,
        actionTaken:  actionTaken  || null,
        reportedBy,
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (err) {
    console.error('Behavior log POST error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create log' }, { status: 500 });
  }
}
