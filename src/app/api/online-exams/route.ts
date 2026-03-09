export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const exams = await db.exam.findMany({ include: { schedules: { include: { subject: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: exams });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
