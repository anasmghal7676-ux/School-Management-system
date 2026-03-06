export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp       = request.nextUrl.searchParams;
    const classId  = sp.get('classId')  || '';
    const sectionId = sp.get('sectionId') || '';
    const subjectId = sp.get('subjectId') || '';
    const fromDate  = sp.get('fromDate');
    const toDate    = sp.get('toDate');
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '20');

    const where: any = {};
    if (classId)   where.classId   = classId;
    if (sectionId) where.sectionId = sectionId;
    if (subjectId) where.subjectId = subjectId;
    if (fromDate || toDate) {
      where.homeworkDate = {};
      if (fromDate) where.homeworkDate.gte = new Date(fromDate);
      if (toDate)   where.homeworkDate.lte = new Date(toDate + 'T23:59:59');
    }

    const [homeworks, total] = await Promise.all([
      db.homework.findMany({
        where,
        include: {
          class:   { select: { name: true } },
          section: { select: { name: true } },
          _count:  { select: { submissions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { homeworkDate: 'desc' },
      }),
      db.homework.count({ where }),
    ]);

    // Enrich with subject info
    const subjectIds = [...new Set(homeworks.map(h => h.subjectId).filter(Boolean))] as string[];
    const subjects   = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    const enriched = homeworks.map(h => ({
      ...h,
      subject:  h.subjectId ? subMap[h.subjectId] : null,
      isOverdue: new Date() > new Date(h.submissionDate),
    }));

    return NextResponse.json({
      success: true,
      data: { homeworks: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Homework GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch homework' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, sectionId, subjectId, assignedBy, homeworkDate, submissionDate, title, description, totalMarks } = body;

    if (!classId || !title || !homeworkDate || !submissionDate || !assignedBy) {
      return NextResponse.json({ success: false, message: 'classId, title, dates and assignedBy are required' }, { status: 400 });
    }

    const hw = await db.homework.create({
      data: {
        classId,
        sectionId:      sectionId      || null,
        subjectId:      subjectId      || null,
        assignedBy,
        homeworkDate:   new Date(homeworkDate),
        submissionDate: new Date(submissionDate),
        title,
        description:    description    || null,
        totalMarks:     totalMarks     ? parseFloat(totalMarks) : null,
      },
      include: {
        class:   { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: hw }, { status: 201 });
  } catch (error) {
    console.error('Homework POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create homework' }, { status: 500 });
  }
}
