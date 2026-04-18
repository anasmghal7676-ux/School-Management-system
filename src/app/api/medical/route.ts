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
    const classId   = sp.get('classId')   || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const studentFilter = classId ? { currentClassId: classId } : undefined;

    const [records, total] = await Promise.all([
      db.medicalRecord.findMany({
        where: {
          ...where,
          ...(studentFilter ? { student: studentFilter } : {}),
        },
        include: {
          student: {
            select: {
              id: true, fullName: true, admissionNumber: true, rollNumber: true, bloodGroup: true,
              class: { select: { name: true } }, section: { select: { name: true } },
            },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { checkupDate: 'desc' },
      }),
      db.medicalRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { records, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Medical GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      studentId, checkupDate, doctorName,
      heightCm, weightKg, bloodPressure,
      medicalObservations, prescriptions, nextCheckupDate,
    } = body;

    if (!studentId || !checkupDate) {
      return NextResponse.json({ success: false, message: 'studentId and checkupDate required' }, { status: 400 });
    }

    const record = await db.medicalRecord.create({
      data: {
        studentId,
        checkupDate:         new Date(checkupDate),
        doctorName:          doctorName          || null,
        heightCm:            heightCm            ? parseFloat(heightCm)  : null,
        weightKg:            weightKg            ? parseFloat(weightKg)  : null,
        bloodPressure:       bloodPressure       || null,
        medicalObservations: medicalObservations || null,
        prescriptions:       prescriptions       || null,
        nextCheckupDate:     nextCheckupDate     ? new Date(nextCheckupDate) : null,
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Medical POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create record' }, { status: 500 });
  }
}
