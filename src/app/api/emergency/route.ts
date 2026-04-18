export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const contacts = await db.systemSetting.findMany({ where: { settingKey: { startsWith: 'emergency_' } } });
    return NextResponse.json({ success: true, data: contacts });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
