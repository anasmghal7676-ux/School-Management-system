export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const examId  = searchParams.get('examId')  || '';
    const classId = searchParams.get('classId') || '';

    const where: any = {};
    if (examId)  where.examId  = examId;
    if (classId) where.classId = classId;

    const schedules = await db.examSchedule.findMany({
      where,
      include: {
        exam:  { select: { id: true, name: true, examType: true, academicYear: { select: { name: true } } } },
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    // Enrich with subject names
    const subjectIds = [...new Set(schedules.map(s => s.subjectId))];
    const subjects   = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const enriched   = schedules.map(s => ({ ...s, subject: subjectMap[s.subjectId] || null }));

    const exams = await db.exam.findMany({
      select: { id: true, name: true, examType: true, startDate: true, endDate: true },
      orderBy: { startDate: 'desc' },
    });
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });

    const byDate: Record<string, any[]> = {};
    enriched.forEach((s: any) => {
      const d = s.examDate.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(s);
    });

    return NextResponse.json({ schedules: enriched, byDate, exams, classes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { examId, classId, subjectId, examDate, startTime, endTime, maxMarks, passMarks } = body;

    const schedule = await db.examSchedule.create({
      data: {
        examId,
        classId,
        subjectId,
        examDate:  new Date(examDate),
        startTime: new Date(startTime || examDate),
        endTime:   new Date(endTime   || examDate),
        maxMarks:  maxMarks  ? parseFloat(maxMarks)  : 100,
        passMarks: passMarks ? parseFloat(passMarks) : 33,
      },
      include: { exam: true, class: true },
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
    const { id, examDate, startTime, endTime, maxMarks, passMarks, ...rest } = body;
    const data: any = { ...rest };
    if (examDate)  data.examDate  = new Date(examDate);
    if (startTime) data.startTime = new Date(startTime);
    if (endTime)   data.endTime   = new Date(endTime);
    if (maxMarks  !== undefined) data.maxMarks  = parseFloat(maxMarks);
    if (passMarks !== undefined) data.passMarks = parseFloat(passMarks);
    // Remove unknown fields
    delete data.venue; delete data.invigilator; delete data.totalMarks; delete data.passingMarks; delete data.instructions;
    const schedule = await db.examSchedule.update({ where: { id }, data, include: { exam: true, class: true } });
    return NextResponse.json({ schedule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.examSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
