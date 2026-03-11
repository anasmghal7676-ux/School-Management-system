export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const classId   = sp.get('classId')   || '';
    const minDue    = parseFloat(sp.get('minDue') || '0');
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '30');

    const students = await db.student.findMany({
      where: {
        status: 'active',
        ...(classId ? { currentClassId: classId } : {}),
        ...(search ? {
          OR: [
            { fullName:        { contains: search, mode: 'insensitive' } },
            { admissionNumber: { contains: search, mode: 'insensitive' } },
            { fatherName:      { contains: search, mode: 'insensitive' } },
            { fatherPhone:     { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        class:   { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        feePayments: {
          select: { id: true, paidAmount: true, paymentDate: true, paymentMode: true, status: true },
        },
        feeAssignments: {
          select: { finalAmount: true, feeStructure: { select: { id: true, amount: true, feeType: { select: { name: true } } } } },
        },
      },
    });

    const withBalances = students.map(student => {
      const totalAssigned = student.feeAssignments.reduce((sum, a) => sum + a.finalAmount, 0);
      const totalPaid     = student.feePayments
        .filter(p => p.status !== 'Cancelled')
        .reduce((sum, p) => sum + p.paidAmount, 0);
      const outstanding   = Math.max(0, totalAssigned - totalPaid);
      const lastPayment   = student.feePayments
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];

      return {
        id: student.id, fullName: student.fullName,
        admissionNumber: student.admissionNumber, rollNumber: student.rollNumber,
        fatherName: student.fatherName, fatherPhone: student.fatherPhone,
        class: student.class, section: student.section,
        totalAssigned, totalPaid, outstanding,
        lastPaymentDate: lastPayment?.paymentDate || null,
        lastPaymentAmt: lastPayment?.paidAmount || 0,
        paymentCount: student.feePayments.length,
      };
    });

    const defaulters = withBalances
      .filter(s => s.outstanding > minDue)
      .sort((a, b) => b.outstanding - a.outstanding);

    const total            = defaulters.length;
    const totalOutstanding = defaulters.reduce((s, d) => s + d.outstanding, 0);
    const paginated        = defaulters.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        defaulters: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: {
          total, totalOutstanding,
          critical: defaulters.filter(d => d.outstanding >= 50000).length,
          high:     defaulters.filter(d => d.outstanding >= 20000 && d.outstanding < 50000).length,
          medium:   defaulters.filter(d => d.outstanding >= 5000  && d.outstanding < 20000).length,
          low:      defaulters.filter(d => d.outstanding < 5000).length,
        },
      },
    });
  } catch (error) {
    console.error('Fee defaulters error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch fee defaulters' }, { status: 500 });
  }
}
