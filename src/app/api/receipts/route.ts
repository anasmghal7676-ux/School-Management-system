export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const paymentId = sp.get('paymentId') || '';
    const studentId = sp.get('studentId') || '';
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '20');

    const where: any = {};
    if (paymentId) where.id = paymentId;
    if (studentId) where.studentId = studentId;
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { student: { fullName:        { contains: search, mode: 'insensitive' } } },
        { student: { admissionNumber: { contains: search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      db.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true, fullName: true, admissionNumber: true, rollNumber: true,
              fatherName: true, fatherPhone: true,
              currentClass:   { select: { name: true } },
              currentSection: { select: { name: true } },
            },
          },
          paymentItems: {
            include: { feeType: { select: { name: true } } },
          },
        },
        orderBy: { paymentDate: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.feePayment.count({ where }),
    ]);

    const settings = await db.systemSetting.findMany({
      where: { key: { in: ['school_name', 'school_phone', 'school_address', 'school_logo', 'school_email', 'school_city'] } },
    });
    const school: Record<string, string> = {};
    settings.forEach(s => { school[s.key] = s.value; });

    return NextResponse.json({
      success: true,
      data: { payments, school, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Receipts GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch receipts' }, { status: 500 });
  }
}
