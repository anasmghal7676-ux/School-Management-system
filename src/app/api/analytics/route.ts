export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp     = request.nextUrl.searchParams;
    const examId = sp.get('examId') || '';
    const type   = sp.get('type')   || 'overview';

    if (type === 'overview') {
      const [totalStudents, totalExams, totalMarksCount] = await Promise.all([
        db.student.count({ where: { status: 'active' } }),
        db.exam.count(),
        db.mark.count(),
      ]);

      const gradedMarks = await db.mark.findMany({
        where: { isAbsent: false },
        select: { marksObtained: true, examSchedule: { select: { passMarks: true, maxMarks: true } } },
      });
      const totalGradedMarks = gradedMarks.length;
      const passedMarks = gradedMarks.filter(m =>
        m.marksObtained != null && m.examSchedule.passMarks != null && m.marksObtained >= m.examSchedule.passMarks
      ).length;

      const schedules = await db.examSchedule.findMany({
        include: { exam: { select: { name: true } } },
      });
      const subjectIds = [...new Set(schedules.map(s => s.subjectId))];
      const subjects = await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } });
      const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

      const subjectPerformance = await Promise.all(schedules.map(async sched => {
        const marks = await db.mark.findMany({
          where: { examScheduleId: sched.id, isAbsent: false },
          select: { marksObtained: true },
        });
        if (marks.length === 0) return null;
        const maxMarks = sched.maxMarks || 100;
        const avgPct = marks.reduce((s, m) => s + ((m.marksObtained || 0) / maxMarks) * 100, 0) / marks.length;
        const subj = subjectMap[sched.subjectId];
        return {
          subjectName: subj?.name || 'Unknown',
          subjectCode: subj?.code || '',
          examTitle: sched.exam.name,
          avgPercentage: parseFloat(avgPct.toFixed(1)),
          studentCount: marks.length,
        };
      }));

      const gradeMarks = await db.mark.findMany({
        where: { isAbsent: false },
        select: { marksObtained: true, examSchedule: { select: { maxMarks: true } } },
      });
      const gradeBuckets: Record<string, number> = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
      gradeMarks.forEach(m => {
        if (m.marksObtained == null) return;
        const pct = (m.marksObtained / (m.examSchedule.maxMarks || 100)) * 100;
        if (pct >= 90) gradeBuckets['A+']++;
        else if (pct >= 80) gradeBuckets['A']++;
        else if (pct >= 70) gradeBuckets['B']++;
        else if (pct >= 60) gradeBuckets['C']++;
        else if (pct >= 50) gradeBuckets['D']++;
        else gradeBuckets['F']++;
      });

      const attGroups = await db.attendance.groupBy({ by: ['status'], _count: true });
      const attMap = Object.fromEntries(attGroups.map(g => [g.status, g._count]));

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalStudents, totalExams, totalMarksCount,
            passRate: totalGradedMarks > 0 ? parseFloat(((passedMarks / totalGradedMarks) * 100).toFixed(1)) : 0,
          },
          subjectPerformance: (subjectPerformance.filter(Boolean) as any[])
            .sort((a, b) => b.avgPercentage - a.avgPercentage).slice(0, 10),
          gradeDistribution: Object.entries(gradeBuckets).map(([grade, count]) => ({ grade, count })),
          attendance: { present: attMap['Present'] || 0, absent: attMap['Absent'] || 0, late: attMap['Late'] || 0 },
        },
      });
    }

    if (type === 'class-comparison' && examId) {
      const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
      const classData = await Promise.all(classes.map(async cls => {
        const students = await db.student.findMany({
          where: { status: 'active', currentClassId: cls.id },
          select: { id: true },
        });
        if (students.length === 0) return null;
        const studentIds = students.map(s => s.id);
        const marks = await db.mark.findMany({
          where: { studentId: { in: studentIds }, examSchedule: { examId }, isAbsent: false },
          select: { marksObtained: true, examSchedule: { select: { maxMarks: true, passMarks: true } } },
        });
        if (marks.length === 0) return null;
        const avgPct = marks.reduce((s, m) => s + ((m.marksObtained || 0) / (m.examSchedule.maxMarks || 100)) * 100, 0) / marks.length;
        const passedCount = marks.filter(m => m.marksObtained != null && m.examSchedule.passMarks != null && m.marksObtained >= m.examSchedule.passMarks).length;
        return {
          className: cls.name, classId: cls.id,
          studentCount: students.length, marksCount: marks.length,
          avgPercentage: parseFloat(avgPct.toFixed(1)),
          passRate: parseFloat(((passedCount / marks.length) * 100).toFixed(1)),
        };
      }));
      return NextResponse.json({ success: true, data: { classComparison: classData.filter(Boolean) } });
    }

    if (type === 'subject-analysis' && examId) {
      const schedules = await db.examSchedule.findMany({ where: { examId } });
      const subjectIds = [...new Set(schedules.map(s => s.subjectId))];
      const subjects = await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } });
      const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

      const subjectData = await Promise.all(schedules.map(async sched => {
        const marks = await db.mark.findMany({
          where: { examScheduleId: sched.id, isAbsent: false },
          select: { marksObtained: true },
        });
        if (marks.length === 0) return null;
        const maxMarks = sched.maxMarks || 100;
        const passMarks = sched.passMarks || 0;
        const pcts = marks.map(m => ((m.marksObtained || 0) / maxMarks) * 100);
        const avgPct = pcts.reduce((s, p) => s + p, 0) / pcts.length;
        const passedCount = marks.filter(m => (m.marksObtained || 0) >= passMarks).length;
        const subj = subjectMap[sched.subjectId];
        return {
          subjectName: subj?.name || 'Unknown', subjectCode: subj?.code || '',
          maxMarks: sched.maxMarks, studentCount: marks.length,
          avgPercentage: parseFloat(avgPct.toFixed(1)),
          passRate: parseFloat(((passedCount / marks.length) * 100).toFixed(1)),
          highest: parseFloat(Math.max(...pcts).toFixed(1)),
          lowest: parseFloat(Math.min(...pcts).toFixed(1)),
        };
      }));
      return NextResponse.json({ success: true, data: { subjectAnalysis: subjectData.filter(Boolean) } });
    }

    return NextResponse.json({ success: false, message: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch analytics' }, { status: 500 });
  }
}
