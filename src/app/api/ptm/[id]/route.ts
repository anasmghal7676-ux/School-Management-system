import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [meeting, appointments] = await Promise.all([
      (db as any).parentTeacherMeeting.findUnique({
        where: { id: params.id },
        include: { _count: { select: { appointments: true } } },
      }),
      (db as any).ptmAppointment.findMany({
        where: { meetingId: params.id },
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, currentClass: { select: { name: true } } } },
        },
        orderBy: { slotTime: 'asc' },
      }),
    ]);

    if (!meeting) {
      return NextResponse.json({ success: false, message: 'Meeting not found' }, { status: 404 });
    }

    const attended  = appointments.filter((a: any) => a.status === 'Attended').length;
    const missed    = appointments.filter((a: any) => a.status === 'Missed').length;
    const cancelled = appointments.filter((a: any) => a.status === 'Cancelled').length;

    return NextResponse.json({
      success: true,
      data: { meeting, appointments, summary: { total: appointments.length, attended, missed, cancelled } },
    });
  } catch (error) {
    console.error('PTM appointments GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { studentId, parentName, parentPhone, teacherName, slotTime } = body;

    if (!studentId || !parentName || !teacherName || !slotTime) {
      return NextResponse.json(
        { success: false, message: 'studentId, parentName, teacherName, slotTime required' },
        { status: 400 }
      );
    }

    // Check slot not already booked for this teacher + time
    const existing = await (db as any).ptmAppointment.findFirst({
      where: { meetingId: params.id, teacherName, slotTime, status: { not: 'Cancelled' } },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'This slot is already booked for this teacher' }, { status: 409 });
    }

    const appointment = await (db as any).ptmAppointment.create({
      data: {
        meetingId: params.id,
        studentId,
        parentName,
        parentPhone: parentPhone || null,
        teacherName,
        slotTime,
        notes: body.notes || null,
        status: 'Booked',
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true, currentClass: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('PTM appointment POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to book appointment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params: _ }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { appointmentId, status, notes } = body;
    if (!appointmentId) return NextResponse.json({ success: false, message: 'appointmentId required' }, { status: 400 });

    const apt = await (db as any).ptmAppointment.update({
      where: { id: appointmentId },
      data: {
        ...(status !== undefined && { status }),
        ...(notes  !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, data: apt });
  } catch (error) {
    console.error('PTM appointment PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params: _ }: { params: { id: string } }) {
  try {
    const aptId = request.nextUrl.searchParams.get('appointmentId');
    if (!aptId) return NextResponse.json({ success: false, message: 'appointmentId required' }, { status: 400 });
    await (db as any).ptmAppointment.delete({ where: { id: aptId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
