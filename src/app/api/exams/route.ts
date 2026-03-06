export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/exams - List exams
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const academicYearId = sp.get('academicYearId');
    const status = sp.get('status');
    const search = sp.get('search') || '';

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (status) where.status = status;
    if (search) where.name = { contains: search };

    const exams = await db.exam.findMany({
      where,
      include: {
        academicYear: { select: { name: true } },
        schedules: {
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
          orderBy: { examDate: 'asc' },
        },
        _count: { select: { schedules: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ success: true, data: { exams, total: exams.length } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST /api/exams - Create exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, startDate, endDate, academicYearId, description, schoolId } = body;

    if (!name || !type || !startDate) {
      return NextResponse.json({ success: false, message: 'name, type and startDate are required' }, { status: 400 });
    }

    const exam = await db.exam.create({
      data: {
        name,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        academicYearId: academicYearId || null,
        description: description || null,
        status: 'Scheduled',
      },
      include: { academicYear: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch (error) {
    console.error('Exams POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create exam' }, { status: 500 });
  }
}
