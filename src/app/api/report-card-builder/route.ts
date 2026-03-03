import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const examId = searchParams.get('examId') || '';

    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    const exams = await prisma.exam.findMany({ orderBy: { startDate: 'desc' }, take: 20 });

    if (!classId || !examId) return NextResponse.json({ classes, exams, cards: [] });

    // Load students and their results
    const students = await prisma.student.findMany({
      where: { classId, status: 'Active' },
      select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, fatherName: true, class: { select: { name: true } } },
      orderBy: [{ rollNumber: 'asc' }, { fullName: 'asc' }],
    });

    const results = await prisma.examResult.findMany({
      where: { examId, student: { classId } },
      include: { subject: { select: { name: true, code: true } } },
    });

    const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { name: true, totalMarks: true } });

    const cards = students.map(s => {
      const studentResults = results.filter(r => r.studentId === s.id);
      const subjects = studentResults.map(r => ({
        name: r.subject.name,
        code: r.subject.code,
        marks: Number(r.marksObtained),
        totalMarks: Number(r.totalMarks || exam?.totalMarks || 100),
        grade: r.grade || '',
        percentage: r.totalMarks ? Math.round((Number(r.marksObtained) / Number(r.totalMarks)) * 100) : 0,
      }));
      const totalObtained = subjects.reduce((s, r) => s + r.marks, 0);
      const totalPossible = subjects.reduce((s, r) => s + r.totalMarks, 0);
      const overallPct = totalPossible ? Math.round((totalObtained / totalPossible) * 100) : 0;
      const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B' : overallPct >= 60 ? 'C' : overallPct >= 50 ? 'D' : 'F';
      return { student: s, subjects, totalObtained, totalPossible, overallPct, overallGrade, examName: exam?.name };
    });

    // Compute class rank
    const sorted = [...cards].sort((a, b) => (b.overallPct || 0) - (a.overallPct || 0));
    sorted.forEach((c, i) => { c.rank = i + 1; c.totalStudents = sorted.length; });

    return NextResponse.json({ classes, exams, cards: sorted, className: classes.find(c => c.id === classId)?.name });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
