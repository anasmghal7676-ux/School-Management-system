import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp       = request.nextUrl.searchParams;
    const status   = sp.get('status')    || '';
    const bookId   = sp.get('bookId')    || '';
    const studentId = sp.get('studentId') || '';
    const memberId  = sp.get('memberId')  || '';
    const overdue   = sp.get('overdue')   === 'true';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (status)    where.status    = status;
    if (bookId)    where.bookId    = bookId;
    if (studentId) where.studentId = studentId;
    if (memberId)  where.memberId  = memberId;
    if (overdue)   where.dueDate   = { lt: new Date() };

    const [transactions, total] = await Promise.all([
      db.libraryTransaction.findMany({
        where,
        include: {
          book:    { select: { id: true, title: true, author: true, accessionNumber: true } },
          student: { select: { id: true, fullName: true, admissionNumber: true } },
          member:  { select: { id: true, memberName: true, memberType: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { issueDate: 'desc' },
      }),
      db.libraryTransaction.count({ where }),
    ]);

    // Auto-mark overdue
    const now = new Date();
    const overdueCount = await db.libraryTransaction.count({
      where: { status: 'Issued', dueDate: { lt: now } },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        overdueCount,
      },
    });
  } catch (error) {
    console.error('Library transactions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, studentId, memberId, dueDate, issuedBy, remarks } = body;

    if (!bookId || (!studentId && !memberId)) {
      return NextResponse.json(
        { success: false, message: 'bookId and (studentId or memberId) are required' },
        { status: 400 }
      );
    }

    // Check book availability
    const book = await db.libraryBook.findUnique({ where: { id: bookId } });
    if (!book) return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
    if (book.availableQuantity <= 0) {
      return NextResponse.json({ success: false, message: 'No copies available' }, { status: 409 });
    }

    // Create transaction and decrease available quantity atomically
    const [transaction] = await db.$transaction([
      db.libraryTransaction.create({
        data: {
          bookId,
          studentId:  studentId || null,
          memberId:   memberId  || null,
          issueDate:  new Date(),
          dueDate:    dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
          issuedBy:   issuedBy || null,
          remarks:    remarks  || null,
          status:     'Issued',
        },
        include: {
          book:    { select: { title: true, accessionNumber: true } },
          student: { select: { fullName: true } },
        },
      }),
      db.libraryBook.update({
        where: { id: bookId },
        data: {
          availableQuantity: { decrement: 1 },
          status: book.availableQuantity === 1 ? 'Issued' : 'Available',
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    console.error('Library transactions POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to issue book' }, { status: 500 });
  }
}
