export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const staffId = sp.get('staffId') || '';
    const where: any = {};
    if (staffId) where.staffId = staffId;
    const payrolls = await db.payroll.findMany({ where, include: { staff: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: payrolls });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
