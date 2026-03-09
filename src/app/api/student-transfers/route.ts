export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const transfers = await db.classPromotion.findMany({
      include: {
        student: true,
        fromClass: true,
        toClass: true,
      },
      orderBy: { promotedAt: 'desc' },
      take: 100
    });
    return NextResponse.json({ success: true, data: transfers });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
