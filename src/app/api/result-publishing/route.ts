import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'default-school';

export async function GET(request: NextRequest) {
  try {
    const sp      = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const examId  = sp.get('examId')  || '';

    // Fetch exams
    const exams = await db.exam.findMany({
      where: { schoolId: SCHOOL_ID, ...(classId ? { classId } : {}) },
      include: {
        class:    { select: { id: true, name: true } },
        subject:  { select: { id: true, name: true } },
        _count:   { select: { marks: true } },
      },
      orderBy: { examDate: 'desc' },
      take: 50,
    });

    // For selected exam, get result stats
    let examResults: any = null;
    if (examId) {
      const [marks, allStudents] = await Promise.all([
        db.examMark.findMany({
          where: { examId },
          include: { student: { select: { id: true, fullName: true, admissionNumber: true, rollNumber: true } } },
          orderBy: { marksObtained: 'desc' },
        }),
        db.student.count({ where: { schoolId: SCHOOL_ID, status: 'active' } }),
      ]);

      const exam      = exams.find(e => e.id === examId);
      const maxMarks  = exam?.totalMarks || 100;
      const passed    = marks.filter(m => m.marksObtained >= (exam?.passingMarks || 0)).length;
      const failed    = marks.length - passed;
      const avgMark   = marks.length > 0 ? marks.reduce((s, m) => s + m.marksObtained, 0) / marks.length : 0;
      const highest   = marks.length > 0 ? Math.max(...marks.map(m => m.marksObtained)) : 0;
      const lowest    = marks.length > 0 ? Math.min(...marks.map(m => m.marksObtained)) : 0;

      examResults = {
        exam,
        marks,
        stats: { total: marks.length, passed, failed, avgMark: avgMark.toFixed(1), highest, lowest, maxMarks },
      };
    }

    // Published status stored in system settings
    const publishedKeys = await db.systemSetting.findMany({
      where: { key: { startsWith: 'result_published_' } },
    });
    const publishedExamIds = new Set(
      publishedKeys.filter(k => k.value === 'true').map(k => k.key.replace('result_published_', ''))
    );

    return NextResponse.json({
      success: true,
      data: { exams: exams.map(e => ({ ...e, isPublished: publishedExamIds.has(e.id) })), examResults },
    });
  } catch (error) {
    console.error('Result publishing GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch results' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, publish } = body;

    if (!examId) return NextResponse.json({ success: false, message: 'examId required' }, { status: 400 });

    await db.systemSetting.upsert({
      where:  { key: `result_published_${examId}` },
      create: { key: `result_published_${examId}`, value: publish ? 'true' : 'false', description: `Result publish status for exam ${examId}` },
      update: { value: publish ? 'true' : 'false' },
    });

    // If publishing, also log in audit
    if (publish) {
      try {
        await (db as any).auditLog.create({
          data: {
            schoolId:  SCHOOL_ID,
            action:    'RESULT_PUBLISHED',
            entityType: 'Exam',
            entityId:  examId,
            details:   JSON.stringify({ examId, publishedAt: new Date().toISOString() }),
          },
        });
      } catch {}
    }

    return NextResponse.json({ success: true, data: { examId, published: publish } });
  } catch (error) {
    console.error('Result publishing POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update publish status' }, { status: 500 });
  }
}
