import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || '';
    const classId = searchParams.get('classId') || '';
    const view = searchParams.get('view') || 'class';

    if (view === 'student' && studentId) {
      // Individual student analytics
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true, section: true },
      });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const marks = await prisma.mark.findMany({
        where: { studentId },
        include: { exam: { select: { name: true, type: true, startDate: true } }, subject: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      // Group by exam
      const byExam: Record<string, any> = {};
      marks.forEach((m: any) => {
        const key = m.examId;
        if (!byExam[key]) byExam[key] = { examName: m.exam?.name, examType: m.exam?.type, date: m.exam?.startDate, subjects: [] };
        const pct = m.totalMarks > 0 ? Math.round((m.obtainedMarks / m.totalMarks) * 100) : 0;
        byExam[key].subjects.push({ subject: m.subject?.name, obtained: m.obtainedMarks, total: m.totalMarks, pct, grade: m.grade });
      });

      const exams = Object.values(byExam).map((e: any) => ({
        ...e,
        avgPct: e.subjects.length ? Math.round(e.subjects.reduce((s: number, x: any) => s + x.pct, 0) / e.subjects.length) : 0,
      }));

      // Subject-wise performance
      const subjectMap: Record<string, number[]> = {};
      marks.forEach((m: any) => {
        const n = m.subject?.name;
        if (!n) return;
        if (!subjectMap[n]) subjectMap[n] = [];
        if (m.totalMarks > 0) subjectMap[n].push(Math.round((m.obtainedMarks / m.totalMarks) * 100));
      });
      const subjects = Object.entries(subjectMap).map(([name, scores]) => ({
        name,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        min: Math.min(...scores),
        max: Math.max(...scores),
        count: scores.length,
      })).sort((a, b) => b.avg - a.avg);

      // Attendance
      const attendance = await prisma.attendance.findMany({ where: { studentId } });
      const attPct = attendance.length ? Math.round((attendance.filter((a: any) => a.status === 'Present').length / attendance.length) * 100) : 0;

      return NextResponse.json({ student, exams, subjects, attPct, totalExams: exams.length });
    }

    // Class analytics
    const cid = classId;
    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });

    if (!cid) return NextResponse.json({ classes });

    const students = await prisma.student.findMany({
      where: { classId: cid, status: 'Active' },
      select: { id: true, fullName: true, admissionNumber: true },
    });

    const exams = await prisma.exam.findMany({ orderBy: { startDate: 'desc' }, take: 10 });

    // For each exam, get avg marks for this class
    const examStats = await Promise.all(exams.map(async (exam: any) => {
      const marks = await prisma.mark.findMany({
        where: { examId: exam.id, student: { classId: cid } },
        select: { obtainedMarks: true, totalMarks: true, studentId: true },
      });
      if (!marks.length) return null;
      const valid = marks.filter((m: any) => m.totalMarks > 0);
      const avg = valid.length ? Math.round(valid.reduce((s: any, m: any) => s + (m.obtainedMarks / m.totalMarks) * 100, 0) / valid.length) : 0;
      const passCount = valid.filter((m: any) => (m.obtainedMarks / m.totalMarks) * 100 >= 40).length;
      return { name: exam.name, type: exam.type, date: exam.startDate, avg, passRate: valid.length ? Math.round((passCount / valid.length) * 100) : 0, count: valid.length };
    }));

    // Top performers in class
    const allMarks = await prisma.mark.findMany({
      where: { student: { classId: cid } },
      select: { studentId: true, obtainedMarks: true, totalMarks: true },
    });
    const studentScores: Record<string, number[]> = {};
    allMarks.forEach((m: any) => {
      if (!studentScores[m.studentId]) studentScores[m.studentId] = [];
      if (m.totalMarks > 0) studentScores[m.studentId].push((m.obtainedMarks / m.totalMarks) * 100);
    });
    const performers = students.map(s => ({
      ...s,
      avg: studentScores[s.id]?.length ? Math.round(studentScores[s.id].reduce((a, b) => a + b, 0) / studentScores[s.id].length) : 0,
    })).sort((a, b) => b.avg - a.avg).slice(0, 10);

    return NextResponse.json({ classes, students, examStats: examStats.filter(Boolean), performers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
