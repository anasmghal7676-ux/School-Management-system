export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const appraisals = await db.staffAppraisal.findMany({ include: { staff: { include: { department: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: appraisals });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
