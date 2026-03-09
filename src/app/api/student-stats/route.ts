export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const [total, active, byClass, byGender] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { status: 'active' } }),
      db.student.groupBy({ by: ['currentClassId'], _count: true }),
      db.student.groupBy({ by: ['gender'], _count: true }),
    ]);
    return NextResponse.json({ success: true, data: { total, active, byClass, byGender } });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
