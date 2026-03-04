import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { actualVacateDate, remarks, status } = body;

    const admission = await db.hostelAdmission.findUnique({ where: { id: (await params).id } });
    if (!admission) return NextResponse.json({ success: false, message: 'Admission not found' }, { status: 404 });

    const vacating = status === 'Vacated' || actualVacateDate;

    const [updated] = await db.$transaction([
      db.hostelAdmission.update({
        where: { id: (await params).id },
        data: {
          status:           vacating ? 'Vacated' : status || admission.status,
          actualVacateDate: actualVacateDate ? new Date(actualVacateDate) : admission.actualVacateDate,
          remarks:          remarks ?? admission.remarks,
        },
        include: {
          student: { select: { fullName: true } },
          room:    { select: { roomNumber: true } },
        },
      }),
      // Free the room if vacating
      ...(vacating ? [
        db.hostelRoom.update({
          where: { id: admission.roomId },
          data:  { status: 'Available' },
        }),
      ] : []),
    ]);

    return NextResponse.json({
      success: true,
      data:    updated,
      message: vacating ? 'Student vacated, room freed' : 'Admission updated',
    });
  } catch (error) {
    console.error('Hostel admission PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update admission' }, { status: 500 });
  }
}
