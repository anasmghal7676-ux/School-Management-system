export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const structures = await db.feeStructure.findMany({ include: { class: true, feeType: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: structures });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
