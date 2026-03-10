export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId   = searchParams.get('classId')   || '';
    const monthYear = searchParams.get('monthYear') || '';

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    if (!classId) return NextResponse.json({ classes, students: [] });

    const students = await db.student.findMany({
      where: { currentClassId: classId, status: 'active' },
      include: {
        feePayments: {
          where: monthYear ? { monthYear } : {},
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const enriched = students.map((s: any) => ({
      id:              s.id,
      fullName:        s.fullName,
      admissionNumber: s.admissionNumber,
      rollNumber:      s.rollNumber,
      latestPayment:   s.feePayments[0] || null,
      isPaid:          s.feePayments[0]?.status === 'Success',
    }));

    const academicYears = await db.academicYear.findMany({ orderBy: { name: 'desc' }, take: 5 });
    return NextResponse.json({ classes, students: enriched, academicYears });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { payments, collectionDate, receivedBy } = await req.json();
    let successCount = 0;
    for (const p of payments) {
      if (!p.studentId || !p.amount) continue;
      const amt = Number(p.amount);
      const receiptNumber = `BLK-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      await db.feePayment.create({
        data: {
          studentId:     p.studentId,
          receiptNumber,
          totalAmount:   amt,
          paidAmount:    amt,
          paymentDate:   collectionDate ? new Date(collectionDate) : new Date(),
          paymentMode:   p.paymentMode || 'Cash',
          receivedBy:    receivedBy || 'Admin',
          remarks:       p.description || 'Bulk fee collection',
          status:        'Success',
        },
      });
      successCount++;
    }
    return NextResponse.json({ successCount });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
