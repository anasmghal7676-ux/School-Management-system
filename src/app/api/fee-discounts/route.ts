export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const type      = sp.get('type')      || '';
    const active    = sp.get('active');
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (studentId) where.studentId   = studentId;
    if (type)      where.discountType = type;
    if (active === 'true') where.isActive = true;

    const [discounts, total] = await Promise.all([
      db.feeDiscount.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.feeDiscount.count({ where }),
    ]);

    // Enrich with student data
    const studentIds = [...new Set(discounts.map(d => d.studentId))];
    const students   = studentIds.length > 0
      ? await db.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } },
        })
      : [];
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    const enriched = discounts.map(d => ({
      ...d,
      student: studentMap[d.studentId] || null,
    }));

    // Type breakdown
    const typeCounts = await db.feeDiscount.groupBy({
      by: ['discountType'],
      where: { isActive: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        discounts: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        typeCounts: Object.fromEntries(typeCounts.map(t => [t.discountType, t._count])),
      },
    });
  } catch (error) {
    console.error('Fee discounts GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { studentId, discountType, percentage, fixedAmount, validFrom, validTo, approvedBy, reason } = body;

    if (!studentId || !discountType || !validFrom) {
      return NextResponse.json(
        { success: false, message: 'studentId, discountType, and validFrom are required' },
        { status: 400 }
      );
    }
    if (!percentage && !fixedAmount) {
      return NextResponse.json({ success: false, message: 'Either percentage or fixedAmount is required' }, { status: 400 });
    }

    const discount = await db.feeDiscount.create({
      data: {
        studentId,
        discountType,
        percentage:  percentage  ? parseFloat(percentage)  : 0,
        fixedAmount: fixedAmount ? parseFloat(fixedAmount) : null,
        validFrom:   new Date(validFrom),
        validTo:     validTo ? new Date(validTo) : null,
        approvedBy:  approvedBy || null,
        reason:      reason     || null,
        isActive:    true,
      },
    });

    return NextResponse.json({ success: true, data: discount }, { status: 201 });
  } catch (error) {
    console.error('Fee discounts POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create discount' }, { status: 500 });
  }
}
