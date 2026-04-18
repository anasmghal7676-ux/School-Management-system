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
    const where: any = {};
    if (studentId) where.studentId = studentId;
    const payments = await db.feePayment.findMany({ where, include: { student: { include: { class: true } }, items: { include: { feeType: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: payments });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
