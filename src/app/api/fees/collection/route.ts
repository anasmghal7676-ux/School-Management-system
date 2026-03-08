export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    const skip = (page - 1) * limit;
    const studentId = params.get('studentId') || '';
    const where: any = {};
    if (studentId) where.studentId = studentId;

    const [payments, total] = await Promise.all([
      db.feePayment.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { student: { select: { firstName: true, lastName: true, fullName: true, admissionNumber: true } } },
      }),
      db.feePayment.count({ where }),
    ]);

    const totalAmount = await db.feePayment.aggregate({ _sum: { totalAmount: true } }).then(r => r._sum.totalAmount || 0);
    const collectedAmount = await db.feePayment.aggregate({ where: { status: 'paid' }, _sum: { totalAmount: true } }).then(r => r._sum.totalAmount || 0);

    return NextResponse.json({ success: true, data: payments, total, totalAmount, collectedAmount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.studentId || !body.totalAmount) {
      return NextResponse.json({ success: false, error: 'studentId and totalAmount required' }, { status: 400 });
    }

    const paid = parseFloat(body.paidAmount || body.totalAmount);
    const total = parseFloat(body.totalAmount);

    const payment = await db.feePayment.create({
      data: {
        studentId: body.studentId,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: Math.max(0, total - paid),
        status: paid >= total ? 'paid' : 'partial',
        paymentMethod: body.paymentMethod || 'cash',
        paymentDate: new Date(),
        receiptNumber: `RCP-${Date.now()}`,
        month: body.month || new Date().getMonth() + 1,
        year: body.year || new Date().getFullYear(),
        remarks: body.remarks || null,
        academicYearId: body.academicYearId || null,
      },
      include: { student: true },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.studentId || !body.totalAmount) {
      return NextResponse.json({ success: false, error: 'studentId and totalAmount required' }, { status: 400 });
    }
    const receiptNumber = `RCP-${Date.now()}`;
    const payment = await db.feePayment.create({
      data: {
        studentId: body.studentId,
        totalAmount: parseFloat(body.totalAmount),
        paidAmount: parseFloat(body.paidAmount || body.totalAmount),
        status: body.status || 'paid',
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        paymentMethod: body.paymentMethod || 'cash',
        receiptNumber,
        remarks: body.remarks || null,
        academicYearId: body.academicYearId || null,
      },
      include: { student: { select: { firstName: true, lastName: true, fullName: true, admissionNumber: true } } },
    });
    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
