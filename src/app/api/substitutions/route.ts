export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp      = request.nextUrl.searchParams;
    const date    = sp.get('date') || new Date().toISOString().slice(0, 10);
    const status  = sp.get('status') || '';
    const page    = parseInt(sp.get('page')  || '1');
    const limit   = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (date)   where.date = { gte: new Date(date), lte: new Date(date + 'T23:59:59') };
    if (status) where.status = status;

    const [subs, total] = await Promise.all([
      (db as any).substitution.findMany({
        where,
        include: {
          absentTeacher: { select: { id: true, fullName: true, employeeCode: true, designation: true } },
          substitute:    { select: { id: true, fullName: true, employeeCode: true, designation: true } },
          class:         { select: { id: true, name: true } },
          section:       { select: { id: true, name: true } },
        },
        orderBy: [{ date: 'desc' }, { period: 'asc' }],
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      (db as any).substitution.count({ where }),
    ]);

    const [pending, confirmed, today] = await Promise.all([
      (db as any).substitution.count({ where: { status: 'Pending' } }),
      (db as any).substitution.count({ where: { status: 'Confirmed' } }),
      (db as any).substitution.count({ where: { date: { gte: new Date(date), lte: new Date(date + 'T23:59:59') } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        substitutions: subs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { pending, confirmed, today },
      },
    });
  } catch (error) {
    console.error('Substitutions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch substitutions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { date, absentTeacherId, substituteId, classId, sectionId, subjectId, period, reason, notes } = body;

    if (!date || !absentTeacherId || !substituteId || !classId) {
      return NextResponse.json({ success: false, message: 'date, absentTeacherId, substituteId and classId are required' }, { status: 400 });
    }

    if (absentTeacherId === substituteId) {
      return NextResponse.json({ success: false, message: 'Absent teacher and substitute cannot be the same person' }, { status: 400 });
    }

    const sub = await (db as any).substitution.create({
      data: {
        date:            new Date(date),
        absentTeacherId,
        substituteId,
        classId,
        sectionId:       sectionId || null,
        subjectId:       subjectId || null,
        period:          period    ? parseInt(period) : null,
        reason:          reason    || null,
        notes:           notes     || null,
        status:          'Pending',
      },
      include: {
        absentTeacher: { select: { fullName: true } },
        substitute:    { select: { fullName: true } },
        class:         { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: sub }, { status: 201 });
  } catch (error) {
    console.error('Substitutions POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create substitution' }, { status: 500 });
  }
}
