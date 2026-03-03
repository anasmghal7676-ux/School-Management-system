import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'overview';

    if (view === 'overview') {
      const [exams, totalStudents, totalMarks, published] = await Promise.all([
        prisma.exam.findMany({ include: { _count: { select: { marks: true, schedules: true } } }, orderBy: { createdAt: 'desc' } }),
        prisma.student.count({ where: { status: 'Active' } }),
        prisma.mark.count(),
        prisma.exam.count({ where: { isPublished: true } }),
      ]);
      const classes = await prisma.class.findMany({ include: { sections: true }, orderBy: { name: 'asc' } });
      const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ exams, totalStudents, totalMarks, published, classes, subjects });
    }

    if (view === 'marks') {
      const examId = searchParams.get('examId');
      const classId = searchParams.get('classId');
      const subjectId = searchParams.get('subjectId');
      if (!examId) return NextResponse.json({ marks: [] });
      const where: any = { examId };
      if (classId) where.student = { classId };
      if (subjectId) where.subjectId = subjectId;
      const marks = await prisma.mark.findMany({
        where,
        include: { student: { select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } } }, subject: { select: { name: true } } },
        orderBy: [{ student: { fullName: 'asc' } }],
      });
      return NextResponse.json({ marks });
    }

    if (view === 'stats') {
      const examId = searchParams.get('examId');
      if (!examId) return NextResponse.json({ stats: null });
      const marks = await prisma.mark.findMany({ where: { examId }, select: { obtainedMarks: true, totalMarks: true, grade: true, isAbsent: true } });
      const total = marks.length;
      const absent = marks.filter(m => m.isAbsent).length;
      const present = total - absent;
      const avgPct = present > 0 ? marks.filter(m => !m.isAbsent && m.totalMarks > 0).reduce((s, m) => s + (m.obtainedMarks / m.totalMarks) * 100, 0) / (present || 1) : 0;
      const grades: Record<string, number> = {};
      marks.filter(m => m.grade).forEach(m => { grades[m.grade!] = (grades[m.grade!] || 0) + 1; });
      const topMarks = await prisma.mark.findMany({ where: { examId, isAbsent: false }, include: { student: { select: { fullName: true, admissionNumber: true } } }, orderBy: [{ obtainedMarks: 'desc' }], take: 5 });
      return NextResponse.json({ stats: { total, absent, present, avgPct: Math.round(avgPct), grades, topMarks } });
    }

    return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { action, examId } = await req.json();

    if (action === 'toggle_publish') {
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const updated = await prisma.exam.update({ where: { id: examId }, data: { isPublished: !exam.isPublished } });
      return NextResponse.json({ exam: updated });
    }

    if (action === 'create_exam') {
      const { name, examType, startDate, endDate, description } = await req.json();
      const school = await prisma.school.findFirst();
      const exam = await prisma.exam.create({
        data: { name, examType: examType || 'Terminal', startDate: new Date(startDate), endDate: new Date(endDate), description: description || null, isPublished: false, schoolId: school?.id || '' },
      });
      return NextResponse.json({ exam });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { examId } = await req.json();
    await prisma.exam.delete({ where: { id: examId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
