export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const academicYearId = sp.get('academicYearId');
    const search = sp.get('search') || '';

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (search) where.name = { contains: search };

    const exams = await db.exam.findMany({
      where,
      include: {
        academicYear: { select: { name: true } },
        schedules: { include: { class: { select: { name: true } } }, orderBy: { examDate: 'asc' } },
        _count: { select: { schedules: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    // Enrich schedules with subjects
    const subjectIds = [...new Set(exams.flatMap(e => e.schedules.map(s => s.subjectId)))];
    const subjects = subjectIds.length > 0
      ? await db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const enriched = exams.map(e => ({
      ...e,
      schedules: e.schedules.map(s => ({ ...s, subject: subjectMap[s.subjectId] || null })),
    }));

    return NextResponse.json({ success: true, data: { exams: enriched, total: enriched.length } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, examType, type, startDate, endDate, academicYearId, description } = body;
    const finalType = examType || type || 'Terminal';

    if (!name || !startDate) {
      return NextResponse.json({ success: false, message: 'name and startDate are required' }, { status: 400 });
    }

    let ayId = academicYearId;
    if (!ayId) {
      const ay = await db.academicYear.findFirst({ where: { isCurrent: true } });
      ayId = ay?.id;
    }
    if (!ayId) return NextResponse.json({ success: false, message: 'No academic year found' }, { status: 400 });

    const exam = await db.exam.create({
      data: {
        name,
        examType: finalType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        academicYearId: ayId,
        description: description || null,
      },
      include: { academicYear: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch (error) {
    console.error('Exams POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create exam' }, { status: 500 });
  }
}
