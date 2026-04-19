export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp         = request.nextUrl.searchParams;
    const passingYear = sp.get('passingYear') || '';
    const city        = sp.get('city')        || '';
    const mentor      = sp.get('mentor');
    const search      = sp.get('search')      || '';
    const page        = parseInt(sp.get('page')  || '1');
    const limit       = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (passingYear) where.passingYear  = parseInt(passingYear);
    if (city)        where.currentCity  = { contains: city };
    if (mentor === 'true') where.willingToMentor = true;

    if (search) {
      // Search via student relation
      where.student = {
        OR: [
          { fullName:        { contains: search } },
          { admissionNumber: { contains: search } },
        ],
      };
    }

    const [alumni, total] = await Promise.all([
      db.alumni.findMany({
        where,
        include: {
          student: {
            select: {
              fullName: true, admissionNumber: true, gender: true,
              class: { select: { name: true } },
            },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: [{ passingYear: 'desc' }, { studentId: 'asc' }],
      }),
      db.alumni.count({ where }),
    ]);

    const yearGroups = await db.alumni.groupBy({
      by:     ['passingYear'],
      _count: true,
      orderBy: { passingYear: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        alumni,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        yearGroups: yearGroups.map(y => ({ year: y.passingYear, count: y._count })),
      },
    });
  } catch (error) {
    console.error('Alumni GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      studentId, passingYear, currentOccupation, currentEmployer,
      currentCity, contactEmail, contactPhone, willingToMentor, notes,
    } = body;

    if (!studentId || !passingYear) {
      return NextResponse.json({ success: false, message: 'studentId and passingYear required' }, { status: 400 });
    }

    const alumni = await db.alumni.upsert({
      where: { studentId },
      create: {
        studentId,
        passingYear:        parseInt(passingYear),
        currentOccupation:  currentOccupation  || null,
        currentEmployer:    currentEmployer    || null,
        currentCity:        currentCity        || null,
        contactEmail:       contactEmail       || null,
        contactPhone:       contactPhone       || null,
        willingToMentor:    willingToMentor    ?? false,
        notes:              notes              || null,
      },
      update: {
        passingYear:        parseInt(passingYear),
        currentOccupation:  currentOccupation  || null,
        currentEmployer:    currentEmployer    || null,
        currentCity:        currentCity        || null,
        contactEmail:       contactEmail       || null,
        contactPhone:       contactPhone       || null,
        willingToMentor:    willingToMentor    ?? false,
        notes:              notes              || null,
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: alumni }, { status: 201 });
  } catch (error) {
    console.error('Alumni POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to register alumni' }, { status: 500 });
  }
}
