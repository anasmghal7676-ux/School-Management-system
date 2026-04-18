export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { returnDate, returnedTo, remarks, finePaid } = body;

    const tx = await db.libraryTransaction.findUnique({ where: { id: (await params).id } });
    if (!tx) return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    if (tx.status === 'Returned') {
      return NextResponse.json({ success: false, message: 'Already returned' }, { status: 400 });
    }

    const now = new Date(returnDate || new Date());
    const due = new Date(tx.dueDate);

    // Calculate fine: PKR 5 per day overdue
    let fineAmount = 0;
    if (now > due) {
      const overdueDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * 5;
    }

    const [updated] = await db.$transaction([
      db.libraryTransaction.update({
        where: { id: (await params).id },
        data: {
          returnDate:  now,
          returnedTo:  returnedTo || null,
          remarks:     remarks || tx.remarks,
          fineAmount,
          finePaid:    finePaid || fineAmount === 0,
          status:      'Returned',
        },
        include: {
          book: { select: { id: true, title: true, availableQuantity: true, quantity: true } },
        },
      }),
      db.libraryBook.update({
        where: { id: tx.bookId },
        data: {
          availableQuantity: { increment: 1 },
          status: 'Available',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: updated,
      message: fineAmount > 0 ? `Returned with fine: PKR ${fineAmount}` : 'Returned successfully',
    });
  } catch (error) {
    console.error('Library return error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process return' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const tx = await db.libraryTransaction.findUnique({
      where: { id: (await params).id },
      include: {
        book:    { select: { id: true, title: true, author: true, accessionNumber: true } },
        student: { select: { id: true, fullName: true, admissionNumber: true } },
        member:  { select: { id: true, memberName: true, memberType: true } },
      },
    });
    if (!tx) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    // Calculate current fine if still issued
    let currentFine = tx.fineAmount;
    if (tx.status === 'Issued' && new Date() > new Date(tx.dueDate)) {
      const overdueDays = Math.ceil((Date.now() - new Date(tx.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      currentFine = overdueDays * 5;
    }

    return NextResponse.json({ success: true, data: { ...tx, currentFine } });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch transaction' }, { status: 500 });
  }
}
