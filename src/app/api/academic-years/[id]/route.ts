export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { name, startDate, endDate, isCurrent, description } = body;

    // If making this the current year, unset others first
    if (isCurrent === true) {
      const existing = await db.academicYear.findUnique({ where: { id: (await params).id }, select: { schoolId: true } });
      if (existing) {
        await db.academicYear.updateMany({
          where: { schoolId: existing.schoolId, isCurrent: true },
          data: { isCurrent: false },
        });
      }
    }

    const year = await db.academicYear.update({
      where: { id: (await params).id },
      data: {
        ...(name        !== undefined && { name }),
        ...(startDate   !== undefined && { startDate: new Date(startDate) }),
        ...(endDate     !== undefined && { endDate: new Date(endDate) }),
        ...(isCurrent   !== undefined && { isCurrent }),
        ...(description !== undefined && { description }),
      },
    });
    return NextResponse.json({ success: true, data: year });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if it's current — block deletion if so
    const year = await db.academicYear.findUnique({ where: { id: (await params).id } });
    if (year?.isCurrent) {
      return NextResponse.json({ success: false, message: 'Cannot delete the active academic year' }, { status: 400 });
    }
    await db.academicYear.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed — year may have related data' }, { status: 400 });
  }
}
