export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp          = request.nextUrl.searchParams;
    const routeId     = sp.get('routeId')     || '';
    const studentId   = sp.get('studentId')   || '';
    const academicYearId = sp.get('academicYearId') || '';
    const status      = sp.get('status')      || 'Active';

    const where: any = {};
    if (routeId)     where.routeId     = routeId;
    if (studentId)   where.studentId   = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status)      where.status      = status;

    const assignments = await db.transportAssignment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } } },
        route:   { select: { id: true, routeNumber: true, routeName: true, monthlyFee: true } },
        stop:    { select: { id: true, stopName: true, stopNumber: true, pickupTime: true } },
      },
      orderBy: [{ route: { routeNumber: 'asc' } }, { stop: { stopNumber: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: { assignments, total: assignments.length } });
  } catch (error) {
    console.error('Transport assignments GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, routeId, stopId, vehicleId, academicYearId, startDate, monthlyFee } = body;

    if (!studentId || !routeId || !stopId || !academicYearId) {
      return NextResponse.json(
        { success: false, message: 'studentId, routeId, stopId, academicYearId required' },
        { status: 400 }
      );
    }

    // Deactivate any existing active assignment for this student in this year
    await db.transportAssignment.updateMany({
      where: { studentId, academicYearId, status: 'Active' },
      data: { status: 'Inactive' },
    });

    const assignment = await db.transportAssignment.create({
      data: {
        studentId,
        routeId,
        stopId,
        vehicleId:     vehicleId  || null,
        academicYearId,
        startDate:     startDate  ? new Date(startDate)  : new Date(),
        monthlyFee:    monthlyFee ? parseFloat(monthlyFee) : null,
        status:        'Active',
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
        route:   { select: { routeNumber: true, routeName: true } },
        stop:    { select: { stopName: true } },
      },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    console.error('Transport assignment POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create assignment' }, { status: 500 });
  }
}
