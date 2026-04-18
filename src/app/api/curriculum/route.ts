export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const where: any = {};
    if (classId) where.classId = classId;
    const subjects = await db.classSubject.findMany({ where, include: { class: true, subject: true }, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ success: true, data: subjects });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
