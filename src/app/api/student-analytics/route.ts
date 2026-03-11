export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || '';
    const classId = searchParams.get('classId') || '';
    const view = searchParams.get('view') || 'class';

    if (view === 'student' && studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { class: true, section: true },
      });
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      const marks = await db.mark.findMany({
        where: { studentId },
        include: {
          examSchedule: {
            include: { exam: { select: { id: true, title: true, examType: true } } },
            select: { id: true, examId: true, subjectId: true, maxMarks: true, passMarks: true, exam: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Fetch subjects separately
      const subjectIds = [...new Set(marks.map(m => m.examSchedule.subjectId))];
      const subjects = subjectIds.length > 0
        ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
        : [];
      const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

      // Group by exam
      const byExam: Record<string, any> = {};
      marks.forEach((m: any) => {
        const key = m.examSchedule.examId;
        if (!byExam[key]) byExam[key] = { examName: m.examSchedule.exam?.title, examType: m.examSchedule.exam?.examType, subjects: [] };
        const maxMarks = m.examSchedule.maxMarks || 100;
        const pct = m.marksObtained != null ? Math.round((m.marksObtained / maxMarks) * 100) : 0;
        byExam[key].subjects.push({ subject: subjectMap[m.examSchedule.subjectId]?.name, obtained: m.marksObtained, total: maxMarks, pct });
      });

      const exams = Object.values(byExam).map((e: any) => ({
        ...e,
        avgPct: e.subjects.length ? Math.round(e.subjects.reduce((s: number, x: any) => s + x.pct, 0) / e.subjects.length) : 0,
      }));

      // Subject-wise performance
      const subjectPerf: Record<string, number[]> = {};
      marks.forEach((m: any) => {
        const name = subjectMap[m.examSchedule.subjectId]?.name;
        if (!name || m.marksObtained == null) return;
        if (!subjectPerf[name]) subjectPerf[name] = [];
        subjectPerf[name].push(Math.round((m.marksObtained / (m.examSchedule.maxMarks || 100)) * 100));
      });
      const subjectStats = Object.entries(subjectPerf).map(([name, scores]) => ({
        name,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        min: Math.min(...scores),
        max: Math.max(...scores),
        count: scores.length,
      })).sort((a, b) => b.avg - a.avg);

      const attendance = await db.attendance.findMany({ where: { studentId } });
      const attPct = attendance.length ? Math.round((attendance.filter((a: any) => a.status === 'Present').length / attendance.length) * 100) : 0;

      return NextResponse.json({ student, exams, subjects: subjectStats, attPct, totalExams: exams.length });
    }

    // Class analytics
    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    if (!classId) return NextResponse.json({ classes });

    const students = await db.student.findMany({
      where: { currentClassId: classId, status: 'active' },
      select: { id: true, fullName: true, admissionNumber: true },
    });

    const exams = await db.exam.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });

    // For each exam, get marks for students in this class via examSchedule
    const examStats = await Promise.all(exams.map(async (exam: any) => {
      const schedules = await db.examSchedule.findMany({
        where: { examId: exam.id },
        select: { id: true, maxMarks: true, passMarks: true },
      });
      if (!schedules.length) return null;
      const schedMap = Object.fromEntries(schedules.map(s => [s.id, s]));
      const marks = await db.mark.findMany({
        where: { examScheduleId: { in: schedules.map(s => s.id) }, student: { currentClassId: classId } },
        select: { marksObtained: true, examScheduleId: true },
      });
      if (!marks.length) return null;
      const valid = marks.filter((m: any) => m.marksObtained != null);
      const avg = valid.length ? Math.round(valid.reduce((s: any, m: any) => {
        const maxM = schedMap[m.examScheduleId]?.maxMarks || 100;
        return s + (m.marksObtained / maxM) * 100;
      }, 0) / valid.length) : 0;
      const passCount = valid.filter((m: any) => {
        const sched = schedMap[m.examScheduleId];
        return m.marksObtained >= (sched?.passMarks || 33);
      }).length;
      return { name: exam.title, type: exam.examType, avg, passRate: valid.length ? Math.round((passCount / valid.length) * 100) : 0, count: valid.length };
    }));

    // Top performers
    const allScheduleIds = (await db.examSchedule.findMany({ select: { id: true, maxMarks: true } }));
    const schedMaxMap = Object.fromEntries(allScheduleIds.map(s => [s.id, s.maxMarks]));
    const allMarks = await db.mark.findMany({
      where: { student: { currentClassId: classId } },
      select: { studentId: true, marksObtained: true, examScheduleId: true },
    });
    const studentScores: Record<string, number[]> = {};
    allMarks.forEach((m: any) => {
      if (m.marksObtained == null) return;
      if (!studentScores[m.studentId]) studentScores[m.studentId] = [];
      const maxM = schedMaxMap[m.examScheduleId] || 100;
      studentScores[m.studentId].push((m.marksObtained / maxM) * 100);
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
