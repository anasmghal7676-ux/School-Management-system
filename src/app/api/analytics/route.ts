import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const examId = sp.get('examId') || '';
    const type   = sp.get('type')   || 'overview';

    if (type === 'overview') {
      // School-wide performance overview
      const [totalStudents, totalExams, totalMarksCount] = await Promise.all([
        db.student.count({ where: { status: 'active' } }),
        db.exam.count(),
        db.mark.count(),
      ]);

      // Overall pass rate
      const [passedMarks, totalGradedMarks] = await Promise.all([
        db.mark.count({ where: { isPassing: true,  isAbsent: false } }),
        db.mark.count({ where: { isAbsent: false } }),
      ]);

      // Top performing subjects (by avg percentage)
      const subjectAvgs = await db.mark.groupBy({
        by: ['examScheduleId'],
        where: { isAbsent: false, percentage: { gt: 0 } },
        _avg: { percentage: true },
        _count: true,
        orderBy: { _avg: { percentage: 'desc' } },
        take: 10,
      });

      // Enrich with subject names
      const schedIds = subjectAvgs.map(s => s.examScheduleId);
      const schedules = schedIds.length > 0
        ? await db.examSchedule.findMany({
            where: { id: { in: schedIds } },
            include: {
              subject: { select: { name: true, code: true } },
              exam:    { select: { title: true } },
            },
          })
        : [];
      const schedMap = Object.fromEntries(schedules.map(s => [s.id, s]));

      const subjectPerformance = subjectAvgs.map(s => ({
        subjectName: schedMap[s.examScheduleId]?.subject?.name || 'Unknown',
        subjectCode: schedMap[s.examScheduleId]?.subject?.code || '',
        examTitle:   schedMap[s.examScheduleId]?.exam?.title   || '',
        avgPercentage: parseFloat((s._avg.percentage || 0).toFixed(1)),
        studentCount: s._count,
      }));

      // Grade distribution across all exams
      const gradeDistrib = await db.mark.groupBy({
        by: ['grade'],
        where: { isAbsent: false, grade: { not: null } },
        _count: true,
        orderBy: { _count: { grade: 'desc' } },
      });

      // Attendance overview
      const attGroups = await db.attendance.groupBy({
        by: ['status'],
        _count: true,
      });
      const attMap = Object.fromEntries(attGroups.map(g => [g.status, g._count]));

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalStudents, totalExams, totalMarksCount,
            passRate: totalGradedMarks > 0 ? parseFloat(((passedMarks / totalGradedMarks) * 100).toFixed(1)) : 0,
          },
          subjectPerformance,
          gradeDistribution: gradeDistrib.map(g => ({ grade: g.grade, count: g._count })),
          attendance: { present: attMap['Present'] || 0, absent: attMap['Absent'] || 0, late: attMap['Late'] || 0 },
        },
      });
    }

    if (type === 'class-comparison' && examId) {
      // Compare class performance for a specific exam
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
        });

        if (marks.length === 0) return null;

        const avgPct  = marks.reduce((s, m) => s + (m.percentage || 0), 0) / marks.length;
        const passedCount = marks.filter(m => m.isPassing).length;
        return {
          className: cls.name,
          classId:   cls.id,
          studentCount: students.length,
          marksCount:   marks.length,
          avgPercentage: parseFloat(avgPct.toFixed(1)),
          passRate:      parseFloat(((passedCount / marks.length) * 100).toFixed(1)),
        };
      }));

      return NextResponse.json({
        success: true,
        data: { classComparison: classData.filter(Boolean) },
      });
    }

    if (type === 'subject-analysis' && examId) {
      const schedules = await db.examSchedule.findMany({
        where:   { examId },
        include: { subject: { select: { name: true, code: true } } },
      });

      const subjectData = await Promise.all(schedules.map(async sched => {
        const marks = await db.mark.findMany({
          where: { examScheduleId: sched.id, isAbsent: false },
        });
        if (marks.length === 0) return null;

        const avgPct = marks.reduce((s, m) => s + (m.percentage || 0), 0) / marks.length;
        const passedCount = marks.filter(m => m.isPassing).length;
        const highest = Math.max(...marks.map(m => m.percentage || 0));
        const lowest  = Math.min(...marks.map(m => m.percentage || 0));

        return {
          subjectName: sched.subject.name,
          subjectCode: sched.subject.code,
          totalMarks:  sched.totalMarks,
          studentCount: marks.length,
          avgPercentage: parseFloat(avgPct.toFixed(1)),
          passRate:      parseFloat(((passedCount / marks.length) * 100).toFixed(1)),
          highest: parseFloat(highest.toFixed(1)),
          lowest:  parseFloat(lowest.toFixed(1)),
        };
      }));

      return NextResponse.json({
        success: true,
        data: { subjectAnalysis: subjectData.filter(Boolean) },
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch analytics' }, { status: 500 });
  }
}
