export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const examId  = sp.get('examId')  || '';
    const classId = sp.get('classId') || '';
    const where: any = {};
    if (examId)  where.examSchedule = { examId };
    if (classId) where.student = { currentClassId: classId };
    const results = await db.mark.findMany({
      where,
      include: { student: { include: { class: true } }, examSchedule: { include: { exam: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return NextResponse.json({ success: true, data: results });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Publish report cards for a class/exam
    const { examId, classId } = body;
    if (examId && classId) {
      // Find students in the class
      const students = await db.student.findMany({
        where: { currentClassId: classId, status: 'active' },
        select: { id: true },
      });
      const studentIds = students.map(s => s.id);
      const updated = await db.reportCard.updateMany({
        where: { examId, studentId: { in: studentIds } },
        data: { remarks: 'Published' },
      });
      return NextResponse.json({ success: true, updated: updated.count });
    }
    return NextResponse.json({ success: false, error: 'examId and classId required' }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
