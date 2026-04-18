export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const classId = sp.get('classId') || '';
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    const cards = await db.reportCard.findMany({
      where,
      include: { student: true, class: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: cards });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.studentId || !body.classId) return NextResponse.json({ success: false, error: 'studentId and classId required' }, { status: 400 });
    const card = await db.reportCard.create({
      data: {
        studentId: body.studentId,
        classId: body.classId,
        academicYearId: body.academicYearId || null,
        term: body.term || null,
        totalMarks: body.totalMarks || 0,
        obtainedMarks: body.obtainedMarks || 0,
        percentage: body.percentage || 0,
        grade: body.grade || null,
        remarks: body.remarks || null,
        isPublished: body.isPublished || false,
      },
      include: { student: true, class: true },
    });
    return NextResponse.json({ success: true, data: card }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
