export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const r = await db.medicalRecord.update({
      where: { id: (await params).id },
      data: {
        ...(body.doctorName          !== undefined && { doctorName: body.doctorName }),
        ...(body.heightCm            !== undefined && { heightCm: body.heightCm ? parseFloat(body.heightCm) : null }),
        ...(body.weightKg            !== undefined && { weightKg: body.weightKg ? parseFloat(body.weightKg) : null }),
        ...(body.bloodPressure       !== undefined && { bloodPressure: body.bloodPressure }),
        ...(body.medicalObservations !== undefined && { medicalObservations: body.medicalObservations }),
        ...(body.prescriptions       !== undefined && { prescriptions: body.prescriptions }),
        ...(body.nextCheckupDate     !== undefined && { nextCheckupDate: body.nextCheckupDate ? new Date(body.nextCheckupDate) : null }),
      },
    });
    return NextResponse.json({ success: true, data: r });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.medicalRecord.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
