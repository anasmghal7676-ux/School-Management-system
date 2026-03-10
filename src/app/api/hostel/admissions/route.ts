export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp            = request.nextUrl.searchParams;
    const roomId        = sp.get('roomId')        || '';
    const studentId     = sp.get('studentId')     || '';
    const academicYearId = sp.get('academicYearId') || '';
    const status        = sp.get('status')        || 'Active';

    const where: any = {};
    if (roomId)        where.roomId        = roomId;
    if (studentId)     where.studentId     = studentId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status)        where.status        = status;

    const admissions = await db.hostelAdmission.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, fullName: true, admissionNumber: true, rollNumber: true,
            class: { select: { name: true } },
          },
        },
        room: {
          select: {
            id: true, roomNumber: true, roomType: true, capacity: true, floorNumber: true,
            block: { select: { id: true, blockName: true, blockType: true } },
          },
        },
        academicYear: { select: { name: true } },
      },
      orderBy: { admissionDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: { admissions, total: admissions.length } });
  } catch (error) {
    console.error('Hostel admissions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, roomId, academicYearId, admissionDate, expectedVacateDate, monthlyFee, remarks } = body;

    if (!studentId || !roomId || !academicYearId) {
      return NextResponse.json(
        { success: false, message: 'studentId, roomId, academicYearId required' },
        { status: 400 }
      );
    }

    // Check room availability
    const room = await db.hostelRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ success: false, message: 'Room not found' }, { status: 404 });
    if (room.status !== 'Available') {
      return NextResponse.json({ success: false, message: `Room is currently ${room.status}` }, { status: 409 });
    }

    // Check existing active admission for student
    const existing = await db.hostelAdmission.findFirst({
      where: { studentId, academicYearId, status: 'Active' },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Student already has an active hostel admission' }, { status: 409 });
    }

    // Create admission and update room status
    const [admission] = await db.$transaction([
      db.hostelAdmission.create({
        data: {
          studentId,
          roomId,
          academicYearId,
          admissionDate:     admissionDate     ? new Date(admissionDate) : new Date(),
          expectedVacateDate: expectedVacateDate ? new Date(expectedVacateDate) : null,
          monthlyFee:        monthlyFee        ? parseFloat(monthlyFee) : room.monthlyFee,
          remarks:           remarks           || null,
          status:            'Active',
        },
        include: {
          student: { select: { fullName: true, admissionNumber: true } },
          room:    { select: { roomNumber: true, block: { select: { blockName: true } } } },
        },
      }),
      db.hostelRoom.update({
        where: { id: roomId },
        data:  { status: 'Occupied' },
      }),
    ]);

    return NextResponse.json({ success: true, data: admission }, { status: 201 });
  } catch (error) {
    console.error('Hostel admission POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create admission' }, { status: 500 });
  }
}
