import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, examType, startDate, endDate, passingPercentage, description } = body;
    const updated = await db.exam.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        examType: examType || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        passingPercentage: passingPercentage !== undefined ? parseFloat(passingPercentage) : undefined,
        description: description ?? undefined,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update exam' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.exam.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (e: any) {
    if (e.code === 'P2003') return NextResponse.json({ success: false, message: 'Cannot delete: has associated data' }, { status: 400 });
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
