export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    if (!studentId) {
      const students = await db.student.findMany({
        include: { class: true, section: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ success: true, data: students });
    }
    const [student, attendance, marks, payments] = await Promise.all([
      db.student.findUnique({
        where: { id: studentId },
        include: { class: true, section: true },
      }),
      db.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      db.mark.findMany({
        where: { studentId },
        include: { examSchedule: { include: { exam: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.feePayment.findMany({
        where: { studentId },
        orderBy: { paymentDate: 'desc' },
        take: 10,
      }),
    ]);
    return NextResponse.json({ success: true, data: { student, attendance, marks, payments } });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
