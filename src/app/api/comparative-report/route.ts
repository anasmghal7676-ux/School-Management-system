import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'class'; // class | subject | period
    const examId = searchParams.get('examId') || '';
    const classIds = searchParams.get('classIds')?.split(',').filter(Boolean) || [];
    const subjectId = searchParams.get('subjectId') || '';

    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    const exams = await prisma.exam.findMany({ orderBy: { startDate: 'desc' }, take: 20 });

    if (!examId) return NextResponse.json({ classes, subjects, exams, data: [] });

    if (type === 'class') {
      const targetClasses = classIds.length ? classIds : classes.map(c => c.id);
      const data = await Promise.all(targetClasses.map(async (cid) => {
        const cls = classes.find(c => c.id === cid);
        const results = await prisma.examResult.findMany({
          where: { examId, student: { classId: cid } },
          include: { student: true, subject: true },
        });
        const scores = results.map(r => Number(r.marksObtained));
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
        const max = scores.length ? Math.max(...scores) : 0;
        const min = scores.length ? Math.min(...scores) : 0;
        const passCount = results.filter(r => r.grade && r.grade !== 'F').length;
        const passRate = scores.length ? Math.round((passCount / scores.length) * 100) : 0;
        return { classId: cid, className: cls?.name || cid, studentCount: scores.length, avg, max, min, passRate };
      }));
      return NextResponse.json({ classes, subjects, exams, data: data.filter(d => d.studentCount > 0), type });
    }

    if (type === 'subject') {
      const subjectList = subjectId ? subjects.filter(s => s.id === subjectId) : subjects;
      const data = await Promise.all(subjectList.map(async (sub) => {
        const results = await prisma.examResult.findMany({ where: { examId, subjectId: sub.id } });
        const scores = results.map(r => Number(r.marksObtained));
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
        const passCount = results.filter(r => r.grade && r.grade !== 'F').length;
        const passRate = scores.length ? Math.round((passCount / scores.length) * 100) : 0;
        return { subjectId: sub.id, subjectName: sub.name, studentCount: scores.length, avg, passRate };
      }));
      return NextResponse.json({ classes, subjects, exams, data: data.filter(d => d.studentCount > 0), type });
    }

    return NextResponse.json({ classes, subjects, exams, data: [], type });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
