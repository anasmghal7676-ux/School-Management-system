import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'default-school';

export async function GET(request: NextRequest) {
  try {
    const sp      = request.nextUrl.searchParams;
    const quizId  = sp.get('quizId') || '';
    const page    = parseInt(sp.get('page')  || '1');
    const limit   = parseInt(sp.get('limit') || '20');

    if (quizId) {
      // Return single quiz with questions
      const quiz = await (db as any).quizBank.findUnique({
        where: { id: quizId },
        include: {
          questions: { orderBy: { orderIndex: 'asc' } },
        },
      });
      if (!quiz) return NextResponse.json({ success: false, message: 'Quiz not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: quiz });
    }

    const [quizzes, total] = await Promise.all([
      (db as any).quizBank.findMany({
        include: { _count: { select: { questions: true } } },
        orderBy:  { createdAt: 'desc' },
        skip:     (page - 1) * limit,
        take:     limit,
      }),
      (db as any).quizBank.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: { quizzes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create-quiz') {
      const { title, subjectId, classId, duration, totalMarks, passingMarks, instructions, startTime, endTime } = body;
      if (!title) return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });

      const quiz = await (db as any).quizBank.create({
        data: {
          schoolId:     SCHOOL_ID,
          title,
          subjectId:    subjectId    || null,
          classId:      classId      || null,
          duration:     parseInt(duration)    || 30,
          totalMarks:   parseFloat(totalMarks) || 100,
          passingMarks: parseFloat(passingMarks) || 50,
          instructions: instructions || null,
          startTime:    startTime    ? new Date(startTime) : null,
          endTime:      endTime      ? new Date(endTime)   : null,
        },
      });
      return NextResponse.json({ success: true, data: quiz }, { status: 201 });
    }

    if (action === 'add-question') {
      const { quizId, questionText, questionType, optionA, optionB, optionC, optionD, correctAnswer, marks, explanation } = body;
      if (!quizId || !questionText || !correctAnswer) {
        return NextResponse.json({ success: false, message: 'quizId, questionText and correctAnswer required' }, { status: 400 });
      }

      // Get next order index
      const count = await (db as any).quizQuestion.count({ where: { quizId } });
      const q = await (db as any).quizQuestion.create({
        data: {
          quizId, questionText, questionType: questionType || 'MCQ',
          optionA: optionA || null, optionB: optionB || null,
          optionC: optionC || null, optionD: optionD || null,
          correctAnswer, marks: parseFloat(marks) || 1,
          explanation: explanation || null,
          orderIndex: count,
        },
      });
      return NextResponse.json({ success: true, data: q }, { status: 201 });
    }

    if (action === 'bulk-questions') {
      const { quizId, questions } = body;
      if (!quizId || !questions?.length) {
        return NextResponse.json({ success: false, message: 'quizId and questions required' }, { status: 400 });
      }
      const created = await (db as any).quizQuestion.createMany({
        data: questions.map((q: any, i: number) => ({
          quizId, questionText: q.questionText, questionType: q.questionType || 'MCQ',
          optionA: q.optionA || null, optionB: q.optionB || null,
          optionC: q.optionC || null, optionD: q.optionD || null,
          correctAnswer: q.correctAnswer, marks: parseFloat(q.marks) || 1,
          explanation: q.explanation || null, orderIndex: i,
        })),
      });
      return NextResponse.json({ success: true, data: { count: created.count } }, { status: 201 });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Quiz POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process quiz operation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type } = body;

    if (type === 'quiz') {
      const q = await (db as any).quizBank.update({
        where: { id },
        data: {
          title:        body.title,
          duration:     body.duration     ? parseInt(body.duration)      : undefined,
          totalMarks:   body.totalMarks   ? parseFloat(body.totalMarks)  : undefined,
          passingMarks: body.passingMarks ? parseFloat(body.passingMarks): undefined,
          instructions: body.instructions,
          isActive:     body.isActive     !== undefined ? body.isActive  : undefined,
          startTime:    body.startTime    ? new Date(body.startTime)     : undefined,
          endTime:      body.endTime      ? new Date(body.endTime)       : undefined,
        },
      });
      return NextResponse.json({ success: true, data: q });
    }

    if (type === 'question') {
      const q = await (db as any).quizQuestion.update({
        where: { id },
        data: {
          questionText:  body.questionText,
          questionType:  body.questionType,
          optionA:       body.optionA,
          optionB:       body.optionB,
          optionC:       body.optionC,
          optionD:       body.optionD,
          correctAnswer: body.correctAnswer,
          marks:         body.marks ? parseFloat(body.marks) : undefined,
          explanation:   body.explanation,
        },
      });
      return NextResponse.json({ success: true, data: q });
    }

    return NextResponse.json({ success: false, message: 'type must be quiz or question' }, { status: 400 });
  } catch (error) {
    console.error('Quiz PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sp   = request.nextUrl.searchParams;
    const id   = sp.get('id')   || '';
    const type = sp.get('type') || 'quiz';

    if (type === 'question') {
      await (db as any).quizQuestion.delete({ where: { id } });
    } else {
      await (db as any).quizBank.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
