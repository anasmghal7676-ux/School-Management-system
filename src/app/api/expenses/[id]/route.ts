import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { expenseCategoryId, amount, expenseDate, paymentMode, description, billNumber, vendorName, approvedBy } = body;
    const updated = await db.expense.update({
      where: { id: params.id },
      data: {
        expenseCategoryId: expenseCategoryId || undefined,
        amount:      amount      !== undefined ? parseFloat(amount) : undefined,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        paymentMode: paymentMode ?? undefined,
        description: description ?? undefined,
        billNumber:  billNumber  ?? undefined,
        vendorName:  vendorName  ?? undefined,
        approvedBy:  approvedBy  ?? undefined,
      },
      include: { expenseCategory: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete expense' }, { status: 500 });
  }
}
