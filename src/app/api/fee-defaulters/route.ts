import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'default-school';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const classId   = sp.get('classId')   || '';
    const minDue    = parseFloat(sp.get('minDue') || '0');
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '30');

    // Get all students with fee data
    const students = await db.student.findMany({
      where: {
        schoolId: SCHOOL_ID,
        status:   'active',
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
        currentClass: { select: { id: true, name: true } },
        currentSection: { select: { id: true, name: true } },
        feePayments: {
          select: {
            id: true, amount: true, paidDate: true, paymentMethod: true, status: true,
            feePaymentItems: {
              select: { feeType: { select: { name: true } }, amount: true, dueDate: true },
            },
          },
        },
        feeAssignments: {
          select: { finalAmount: true, feeStructure: { select: { id: true, name: true } } },
        },
      },
    });

    // Calculate outstanding balance per student
    const withBalances = students.map(student => {
      const totalAssigned = student.feeAssignments.reduce((sum, a) => sum + a.finalAmount, 0);
      const totalPaid     = student.feePayments
        .filter(p => p.status !== 'cancelled')
        .reduce((sum, p) => sum + p.amount, 0);
      const outstanding   = Math.max(0, totalAssigned - totalPaid);
      const lastPayment   = student.feePayments
        .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime())[0];

      return {
        id:               student.id,
        fullName:         student.fullName,
        admissionNumber:  student.admissionNumber,
        rollNumber:       student.rollNumber,
        fatherName:       student.fatherName,
        fatherPhone:      student.fatherPhone,
        class:            student.currentClass,
        section:          student.currentSection,
        totalAssigned,
        totalPaid,
        outstanding,
        lastPaymentDate:  lastPayment?.paidDate || null,
        lastPaymentAmt:   lastPayment?.amount   || 0,
        paymentCount:     student.feePayments.length,
      };
    });

    // Filter defaulters (outstanding > minDue)
    const defaulters = withBalances
      .filter(s => s.outstanding > minDue)
      .sort((a, b) => b.outstanding - a.outstanding);

    const total           = defaulters.length;
    const totalOutstanding = defaulters.reduce((s, d) => s + d.outstanding, 0);
    const paginated        = defaulters.slice((page - 1) * limit, page * limit);

    // Severity breakdown
    const critical = defaulters.filter(d => d.outstanding >= 50000).length;
    const high     = defaulters.filter(d => d.outstanding >= 20000 && d.outstanding < 50000).length;
    const medium   = defaulters.filter(d => d.outstanding >= 5000  && d.outstanding < 20000).length;
    const low      = defaulters.filter(d => d.outstanding < 5000).length;

    return NextResponse.json({
      success: true,
      data: {
        defaulters: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { total, totalOutstanding, critical, high, medium, low },
      },
    });
  } catch (error) {
    console.error('Fee defaulters error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch fee defaulters' }, { status: 500 });
  }
}
