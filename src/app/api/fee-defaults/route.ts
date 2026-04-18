export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const structures = await db.feeStructure.findMany({ include: { class: true, feeType: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, data: structures });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
