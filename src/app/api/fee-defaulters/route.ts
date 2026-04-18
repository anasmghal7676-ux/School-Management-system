export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/fee-defaulters — Students with overdue or pending fee payments
// Module 3.5: Fee Defaulters Report
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp      = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const search  = sp.get('search')  || '';
    const page    = parseInt(sp.get('page')  || '1');
    const limit   = Math.min(parseInt(sp.get('limit') || '50'), 200);

    const now = new Date();

    // Students who have fee assignments that are overdue or past-due pending
    const defaulters = await db.studentFeeAssignment.findMany({
      where: {
        student: {
          status: 'active',
          ...(classId ? { currentClassId: classId } : {}),
          ...(search ? {
            OR: [
              { fullName:       { contains: search, mode: 'insensitive' } },
              { admissionNumber:{ contains: search, mode: 'insensitive' } },
              { fatherName:     { contains: search, mode: 'insensitive' } },
            ],
          } : {}),
        },
      },
      include: {
        student: {
          select: {
            id: true, fullName: true, admissionNumber: true,
            fatherName: true, fatherPhone: true,
            currentClassId: true,
            class:   { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        feeStructure: {
          select: { amount: true, frequency: true, feeType: { select: { name: true } } },
        },
      },
      orderBy: { assignedDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.studentFeeAssignment.count({
      where: {
        student: {
          status: 'active',
          ...(classId ? { currentClassId: classId } : {}),
          ...(search ? {
            OR: [
              { fullName:       { contains: search, mode: 'insensitive' } },
              { admissionNumber:{ contains: search, mode: 'insensitive' } },
            ],
          } : {}),
        },
      },
    });

    // Enrich with paid amounts
    const enriched = await Promise.all(defaulters.map(async (d) => {
      const paid = await db.feePayment.aggregate({
        where: { studentId: d.studentId, status: 'Success' },
        _sum: { paidAmount: true },
      });
      const totalDue = d.finalAmount || d.feeStructure.amount;
      const paidAmt  = paid._sum.paidAmount || 0;
      const outstanding = Math.max(0, totalDue - paidAmt);
      return { ...d, totalDue, paidAmount: paidAmt, outstanding };
    }));

    // Only return those with outstanding > 0
    const actualDefaulters = enriched.filter(d => d.outstanding > 0);

    return NextResponse.json({
      success: true,
      data: actualDefaulters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    console.error('Fee defaulters error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
