import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { amount, frequency, isMandatory, description, feeTypeId } = body;
    const updated = await db.feeStructure.update({
      where: { id: (await params).id },
      data: {
        amount:      amount !== undefined ? parseFloat(amount) : undefined,
        frequency:   frequency   || undefined,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : undefined,
        description: description ?? undefined,
        feeTypeId:   feeTypeId   || undefined,
      },
      include: { feeType: true, class: { select: { name: true } } },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update fee structure' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.feeStructure.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (e: any) {
    if (e.code === 'P2003') {
      return NextResponse.json({ success: false, message: 'Cannot delete: has existing assignments or payments' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
