export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const contacts = await db.systemSetting.findMany({ where: { key: { startsWith: 'emergency_' } } });
    return NextResponse.json({ success: true, data: contacts });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
