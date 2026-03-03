import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId') || '';
    const classId = searchParams.get('classId') || '';

    const where: any = {};
    if (examId) where.examId = examId;
    if (classId) where.classId = classId;

    const schedules = await prisma.examSchedule.findMany({
      where,
      include: {
        exam: { select: { id: true, name: true, type: true, academicYear: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    const exams = await prisma.exam.findMany({
      select: { id: true, name: true, type: true, startDate: true, endDate: true },
      orderBy: { startDate: 'desc' },
    });

    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });

    // Group schedules by date
    const byDate: Record<string, any[]> = {};
    schedules.forEach((s: any) => {
      const d = s.examDate.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(s);
    });

    return NextResponse.json({ schedules, byDate, exams, classes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { examId, classId, subjectId, examDate, startTime, endTime, venue, invigilator, totalMarks, passingMarks, instructions } = body;

    const schedule = await prisma.examSchedule.create({
      data: {
        examId,
        classId,
        subjectId,
        examDate: new Date(examDate),
        startTime,
        endTime,
        venue: venue || null,
        invigilator: invigilator || null,
        totalMarks: totalMarks ? parseFloat(totalMarks) : null,
        passingMarks: passingMarks ? parseFloat(passingMarks) : null,
        instructions: instructions || null,
      },
      include: {
        exam: true,
        class: true,
        subject: true,
      },
    });
    return NextResponse.json({ schedule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    if (updates.examDate) updates.examDate = new Date(updates.examDate);
    if (updates.totalMarks) updates.totalMarks = parseFloat(updates.totalMarks);
    if (updates.passingMarks) updates.passingMarks = parseFloat(updates.passingMarks);
    const schedule = await prisma.examSchedule.update({
      where: { id },
      data: updates,
      include: { exam: true, class: true, subject: true },
    });
    return NextResponse.json({ schedule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await prisma.examSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
