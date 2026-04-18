export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const studentId = (await params).id;

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
      },
    });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    // Latest marks (all exams)
    const marks = await db.mark.findMany({
      where: { studentId },
      include: {
        examSchedule: {
          include: {
            exam:    { select: { title: true, examType: true } },
            subject: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attendance summary
    const [attPresent, attAbsent, attLate] = await Promise.all([
      db.attendance.count({ where: { studentId, status: 'Present' } }),
      db.attendance.count({ where: { studentId, status: 'Absent'  } }),
      db.attendance.count({ where: { studentId, status: 'Late'    } }),
    ]);
    const attTotal = attPresent + attAbsent + attLate;

    // Fee summary
    const feeSummary = await db.feePayment.aggregate({
      where: { studentId, status: 'Success' },
      _sum:  { paidAmount: true },
      _count: true,
    });

    // Behavior log
    const behaviors = await db.studentBehaviorLog.findMany({
      where:   { studentId },
      orderBy: { incidentDate: 'desc' },
      take:    5,
      select:  { id: true, incidentType: true, incidentDate: true, description: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        student,
        marks,
        attendance: { present: attPresent, absent: attAbsent, late: attLate, total: attTotal,
          percentage: attTotal > 0 ? parseFloat(((attPresent / attTotal) * 100).toFixed(1)) : 0 },
        fees: { totalPaid: feeSummary._sum.paidAmount || 0, paymentCount: feeSummary._count },
        behaviors,
      },
    });
  } catch (error) {
    console.error('Progress [id] error:', error);
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}
