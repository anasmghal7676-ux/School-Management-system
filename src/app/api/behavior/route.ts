export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp         = request.nextUrl.searchParams;
    const studentId  = sp.get('studentId')  || '';
    const classId    = sp.get('classId')    || '';
    const type       = sp.get('type')       || '';
    const fromDate   = sp.get('fromDate');
    const toDate     = sp.get('toDate');
    const page       = parseInt(sp.get('page')  || '1');
    const limit      = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (studentId) where.studentId    = studentId;
    if (type)      where.incidentType = type;
    if (fromDate || toDate) {
      where.incidentDate = {};
      if (fromDate) where.incidentDate.gte = new Date(fromDate);
      if (toDate)   where.incidentDate.lte = new Date(toDate + 'T23:59:59');
    }

    // classId filter goes through student relation
    const studentWhere = classId ? { currentClassId: classId } : undefined;

    const [logs, total] = await Promise.all([
      db.studentBehaviorLog.findMany({
        where: {
          ...where,
          ...(studentWhere ? { student: studentWhere } : {}),
        },
        include: {
          student: {
            select: {
              id: true, fullName: true, admissionNumber: true, rollNumber: true,
              class: { select: { name: true } }, section: { select: { name: true } },
            },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { incidentDate: 'desc' },
      }),
      db.studentBehaviorLog.count({ where }),
    ]);

    // Type breakdown
    const typeCounts = await db.studentBehaviorLog.groupBy({
      by:      ['incidentType'],
      _count:  true,
      where:   where,
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        typeCounts: Object.fromEntries(typeCounts.map(t => [t.incidentType, t._count])),
      },
    });
  } catch (error) {
    console.error('Behavior GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch behavior logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, incidentDate, incidentType, description, actionTaken, reportedBy } = body;

    if (!studentId || !incidentType || !description || !reportedBy) {
      return NextResponse.json(
        { success: false, message: 'studentId, incidentType, description and reportedBy are required' },
        { status: 400 }
      );
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
  } catch (error) {
    console.error('Behavior POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create behavior log' }, { status: 500 });
  }
}
