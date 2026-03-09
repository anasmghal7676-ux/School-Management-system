export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const appraisals = await db.staffAppraisal.findMany({ include: { staff: { include: { department: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: appraisals });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
