export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/fee-payments - List fee payments with filtering
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get('search') || '';
    const studentId = sp.get('studentId');
    const fromDate = sp.get('fromDate');
    const toDate = sp.get('toDate');
    const paymentMode = sp.get('paymentMode');
    const status = sp.get('status');
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '25');

    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (paymentMode) where.paymentMode = paymentMode;
    if (status) where.status = status;

    if (fromDate && toDate) {
      where.paymentDate = {
        gte: new Date(fromDate),
        lte: new Date(new Date(toDate).setHours(23, 59, 59)),
      };
    } else if (fromDate) {
      where.paymentDate = { gte: new Date(fromDate) };
    }

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { student: { fullName: { contains: search } } },
        { student: { admissionNumber: { contains: search } } },
        { student: { fatherName: { contains: search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      db.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              admissionNumber: true,
              fatherName: true,
              class: { select: { name: true } },
              section: { select: { name: true } },
            },
          },
          items: {
            include: {
              feeStructure: {
                include: { feeType: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      db.feePayment.count({ where }),
    ]);

    // Summary stats
    const summary = await db.feePayment.aggregate({
      where,
      _sum: { paidAmount: true, totalAmount: true, discount: true, fine: true },
      _count: true,
    });

    const byMode = await db.feePayment.groupBy({
      by: ['paymentMode'],
      where,
      _sum: { paidAmount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: {
          totalCollected: summary._sum.paidAmount || 0,
          totalBilled: summary._sum.totalAmount || 0,
          totalDiscount: summary._sum.discount || 0,
          totalFine: summary._sum.fine || 0,
          count: summary._count,
          byMode,
        },
      },
    });
  } catch (error) {
    console.error('Fee payments GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
