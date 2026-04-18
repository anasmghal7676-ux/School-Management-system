export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp      = request.nextUrl.searchParams;
    const examId  = sp.get('examId')  || '';
    const classId = sp.get('classId') || '';

    const where: any = {};
    if (examId)  where.examId  = examId;
    if (classId) where.classId = classId;

    const schedules = await db.examSchedule.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class:   { select: { id: true, name: true } },
        exam:    { select: { id: true, name: true, examType: true } },
        _count:  { select: { marks: true } },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ success: true, data: { schedules, total: schedules.length } });
  } catch (error) {
    console.error('Exam schedules GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { examId, classId, subjectId, examDate, startTime, endTime, roomNumber, maxMarks, passMarks } = body;

    if (!examId || !classId || !subjectId || !examDate) {
      return NextResponse.json({ success: false, message: 'examId, classId, subjectId, examDate required' }, { status: 400 });
    }

    const schedule = await db.examSchedule.create({
      data: {
        examId,
        classId,
        subjectId,
        examDate:   new Date(examDate),
        startTime:  new Date(startTime || examDate),
        endTime:    new Date(endTime   || examDate),
        roomNumber: roomNumber || null,
        maxMarks:   maxMarks   || 100,
        passMarks:  passMarks  || 33,
      },
      include: {
        subject: { select: { id: true, name: true } },
        class:   { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    console.error('Exam schedule POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await db.examSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
