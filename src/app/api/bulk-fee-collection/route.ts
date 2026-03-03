import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const monthYear = searchParams.get('monthYear') || '';

    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    if (!classId) return NextResponse.json({ classes, students: [] });

    const students = await prisma.student.findMany({
      where: { classId, status: 'Active' },
      include: {
        feeChallans: {
          where: monthYear ? { monthYear } : {},
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const enriched = students.map((s: any) => ({
      id: s.id,
      fullName: s.fullName,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber,
      latestChallan: s.feeChallans[0] || null,
      isPaid: s.feeChallans[0]?.status === 'Paid',
    }));

    const academicYears = await prisma.academicYear.findMany({ orderBy: { name: 'desc' }, take: 5 });
    return NextResponse.json({ classes, students: enriched, academicYears });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { payments, collectionDate, receivedBy } = await req.json();
    // payments = [{studentId, amount, description}]
    let successCount = 0;
    for (const p of payments) {
      if (!p.studentId || !p.amount) continue;
      await prisma.feePayment.create({
        data: {
          studentId: p.studentId,
          amount: Number(p.amount),
          paymentDate: collectionDate || new Date().toISOString().slice(0, 10),
          paymentMethod: p.paymentMethod || 'Cash',
          receivedBy: receivedBy || 'Admin',
          description: p.description || 'Bulk fee collection',
          status: 'Completed',
        },
      });
      successCount++;
    }
    return NextResponse.json({ successCount });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
