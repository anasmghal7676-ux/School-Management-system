import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp         = request.nextUrl.searchParams;
    const homeworkId = sp.get('homeworkId') || '';
    const studentId  = sp.get('studentId')  || '';
    const status     = sp.get('status')     || ''; // submitted, pending, graded
    const page       = parseInt(sp.get('page')  || '1');
    const limit      = parseInt(sp.get('limit') || '30');

    const where: any = {};
    if (homeworkId) where.homeworkId = homeworkId;
    if (studentId)  where.studentId  = studentId;
    if (status === 'graded')    where.marksObtained = { not: null };
    if (status === 'submitted') where.AND = [{ submissionDate: { not: null } }, { marksObtained: null }];
    if (status === 'pending')   where.submissionDate = null;

    const [submissions, total] = await Promise.all([
      db.homeworkSubmission.findMany({
        where,
        include: {
          student:  { select: { id: true, fullName: true, admissionNumber: true, rollNumber: true } },
          homework: { select: { id: true, title: true, totalMarks: true, submissionDate: true,
            class: { select: { name: true } }, subject: { select: { name: true } } } },
        },
        orderBy: [{ submissionDate: 'desc' }, { createdAt: 'desc' }],
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.homeworkSubmission.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { submissions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Submissions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeworkId, studentId, submissionDate, remarks, marksObtained, evaluatedBy } = body;

    if (!homeworkId || !studentId) {
      return NextResponse.json({ success: false, message: 'homeworkId and studentId required' }, { status: 400 });
    }

    // Upsert — student can only submit once per homework
    const existing = await db.homeworkSubmission.findFirst({ where: { homeworkId, studentId } });

    let submission;
    if (existing) {
      submission = await db.homeworkSubmission.update({
        where: { id: existing.id },
        data: {
          submissionDate:  submissionDate ? new Date(submissionDate) : existing.submissionDate,
          remarks:         remarks        ?? existing.remarks,
          marksObtained:   marksObtained != null ? parseFloat(marksObtained) : existing.marksObtained,
          evaluatedBy:     evaluatedBy   ?? existing.evaluatedBy,
          evaluationDate:  marksObtained != null ? new Date() : existing.evaluationDate,
        },
        include: { student: { select: { fullName: true } } },
      });
    } else {
      submission = await db.homeworkSubmission.create({
        data: {
          homeworkId,
          studentId,
          submissionDate:  submissionDate ? new Date(submissionDate) : new Date(),
          remarks:         remarks || null,
          marksObtained:   marksObtained != null ? parseFloat(marksObtained) : null,
          evaluatedBy:     evaluatedBy || null,
          evaluationDate:  marksObtained != null ? new Date() : null,
        },
        include: { student: { select: { fullName: true } } },
      });
    }

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    console.error('Submissions POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save submission' }, { status: 500 });
  }
}
