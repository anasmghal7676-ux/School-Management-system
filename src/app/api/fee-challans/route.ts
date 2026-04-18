export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/fee-challans?studentId=&month=YYYY-MM
// Returns challan data: breakdown, total due, discounts, fines, net due
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const month     = sp.get('month')     || '';
    const classId   = sp.get('classId')   || '';

    if (!studentId && !classId) {
      return NextResponse.json({ success: false, error: 'studentId or classId required' }, { status: 400 });
    }

    // Build student where clause
    const studentWhere: any = { status: 'active' };
    if (studentId) studentWhere.id = studentId;
    if (classId)   studentWhere.currentClassId = classId;

    const students = await db.student.findMany({
      where: studentWhere,
      select: {
        id: true, fullName: true, admissionNumber: true,
        fatherName: true, fatherPhone: true,
        class:   { select: { name: true } },
        section: { select: { name: true } },
        feeAssignments: {
          include: {
            feeStructure: {
              include: { feeType: { select: { name: true, code: true } } },
            },
          },
        },
        feeDiscounts: {
          where: { isActive: true },
          select: { discountType: true, percentage: true, fixedAmount: true },
        },
        feeFines: month ? {
          where: { monthYear: month, waived: false },
          select: { fineAmount: true, reason: true },
        } : false,
      },
    });

    const challans = students.map((student) => {
      const breakdown = student.feeAssignments.map((a) => ({
        feeTypeName: a.feeStructure.feeType.name,
        feeTypeCode: a.feeStructure.feeType.code,
        amount:      a.finalAmount || a.feeStructure.amount,
        frequency:   a.feeStructure.frequency,
      }));

      const grossDue = breakdown.reduce((s, b) => s + b.amount, 0);

      // Apply discounts
      const discountAmt = student.feeDiscounts.reduce((s, d) => {
        if (d.fixedAmount) return s + d.fixedAmount;
        return s + (grossDue * (d.percentage / 100));
      }, 0);

      // Apply fines
      const fineAmt = Array.isArray(student.feeFines)
        ? student.feeFines.reduce((s: number, f: any) => s + f.fineAmount, 0)
        : 0;

      const netDue = Math.max(0, grossDue - discountAmt + fineAmt);

      return {
        student: {
          id: student.id, fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          fatherName: student.fatherName, fatherPhone: student.fatherPhone,
          className: student.class?.name, sectionName: student.section?.name,
        },
        month,
        breakdown,
        grossDue,
        discounts: discountAmt,
        fines: fineAmt,
        netDue,
        generatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: challans });
  } catch (e: any) {
    console.error('Fee challan error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST /api/fee-challans — Record a fee payment
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { studentId, paidAmount, paymentMode, monthYear, feeItems, receivedBy, transactionId, bankName, remarks } = body;

    if (!studentId || !paidAmount || !paymentMode) {
      return NextResponse.json(
        { success: false, error: 'studentId, paidAmount, paymentMode are required' },
        { status: 400 }
      );
    }

    // Generate receipt number: RCP-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const rand    = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCP-${dateStr}-${rand}`;

    // Get current academic year
    const currentYear = await db.academicYear.findFirst({
      where: { isCurrent: true }, select: { id: true },
    });

    const payment = await db.feePayment.create({
      data: {
        studentId,
        receiptNumber,
        paidAmount:    parseFloat(paidAmount),
        totalAmount:   parseFloat(paidAmount),
        paymentMode,
        monthYear:     monthYear || null,
        academicYearId: currentYear?.id || null,
        receivedBy:    receivedBy || null,
        transactionId: transactionId || null,
        bankName:      bankName || null,
        remarks:       remarks || null,
        status:        'Success',
        paymentDate:   new Date(),
      },
    });

    // Create fee payment items if provided
    if (feeItems?.length) {
      await db.feePaymentItem.createMany({
        data: feeItems.map((item: any) => ({
          paymentId: payment.id,
          feeTypeId: item.feeTypeId,
          amount:    parseFloat(item.amount),
          monthFor:  monthYear || null,
        })),
      });
    }

    return NextResponse.json({ success: true, data: payment, receiptNumber }, { status: 201 });
  } catch (e: any) {
    console.error('Fee payment error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
