export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const waived    = sp.get('waived');
    const monthYear = sp.get('monthYear') || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (monthYear) where.monthYear = monthYear;
    if (waived === 'false') where.waived = false;
    if (waived === 'true')  where.waived = true;

    const [fines, total] = await Promise.all([
      db.feeFine.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.feeFine.count({ where }),
    ]);

    // Enrich with student data
    const sids     = [...new Set(fines.map(f => f.studentId))];
    const students = sids.length > 0
      ? await db.student.findMany({
          where: { id: { in: sids } },
          select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } },
        })
      : [];
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    const enriched = fines.map(f => ({ ...f, student: studentMap[f.studentId] || null }));

    // Aggregate stats
    const pending = await db.feeFine.aggregate({ where: { waived: false }, _sum: { fineAmount: true }, _count: true });
    const totalAgg = await db.feeFine.aggregate({ _sum: { fineAmount: true }, _count: true });

    return NextResponse.json({
      success: true,
      data: {
        fines: enriched,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: {
          pendingAmount: pending._sum.fineAmount || 0,
          pendingCount:  pending._count,
          totalAmount:   totalAgg._sum.fineAmount || 0,
          totalCount:    totalAgg._count,
        },
      },
    });
  } catch (error) {
    console.error('Fee fines GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch fines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, monthYear, fineAmount, reason } = body;

    if (!studentId || !monthYear || !fineAmount || !reason) {
      return NextResponse.json(
        { success: false, message: 'studentId, monthYear, fineAmount, and reason are required' },
        { status: 400 }
      );
    }

    const fine = await db.feeFine.create({
      data: {
        studentId,
        monthYear,
        fineAmount: parseFloat(fineAmount),
        reason:     reason.trim(),
        waived:     false,
      },
    });

    return NextResponse.json({ success: true, data: fine }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create fine' }, { status: 500 });
  }
}
