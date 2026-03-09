export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const years = await db.academicYear.findMany({ orderBy: { startDate: 'desc' } });
    return NextResponse.json({ success: true, data: years });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
