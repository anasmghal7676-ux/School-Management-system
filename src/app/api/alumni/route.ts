export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp          = request.nextUrl.searchParams;
    const passingYear = sp.get('passingYear') || '';
    const city        = sp.get('city')        || '';
    const mentor      = sp.get('mentor');
    const search      = sp.get('search')      || '';
    const page        = parseInt(sp.get('page')  || '1');
    const limit       = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (passingYear) where.passingYear    = parseInt(passingYear);
    if (city)        where.currentCity    = { contains: city };
    if (mentor === 'true') where.willingToMentor = true;

    // If search, first find matching studentIds from Student table
    let studentIdFilter: string[] = [];
    if (search) {
      const matchingStudents = await db.student.findMany({
        where: {
          OR: [
            { fullName:        { contains: search, mode: 'insensitive' } },
            { admissionNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 200,
      });
      studentIdFilter = matchingStudents.map(s => s.id);
      if (studentIdFilter.length === 0) {
        return NextResponse.json({ success: true, data: { alumni: [], pagination: { page, limit, total: 0, totalPages: 0 }, yearGroups: [] } });
      }
      where.studentId = { in: studentIdFilter };
    }

    const [alumniRows, total] = await Promise.all([
      db.alumni.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: [{ passingYear: 'desc' }, { studentId: 'asc' }],
      }),
      db.alumni.count({ where }),
    ]);

    // Manually join student data
    const studentIds = [...new Set(alumniRows.map(a => a.studentId))];
    const students = studentIds.length > 0
      ? await db.student.findMany({
          where: { id: { in: studentIds } },
          select: {
            id: true, fullName: true, admissionNumber: true, gender: true,
            class: { select: { name: true } },
          },
        })
      : [];
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    const alumni = alumniRows.map(a => ({ ...a, student: studentMap[a.studentId] || null }));

    const yearGroups = await db.alumni.groupBy({
      by:     ['passingYear'],
      _count: true,
      orderBy: { passingYear: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        alumni,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        yearGroups: yearGroups.map(y => ({ year: y.passingYear, count: y._count })),
      },
    });
  } catch (error) {
    console.error('Alumni GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      studentId, passingYear, currentOccupation, currentEmployer,
      currentCity, contactEmail, contactPhone, willingToMentor, notes,
    } = body;

    if (!studentId || !passingYear) {
      return NextResponse.json({ success: false, message: 'studentId and passingYear required' }, { status: 400 });
    }

    const alumni = await db.alumni.upsert({
      where: { studentId },
      create: {
        studentId,
        passingYear:       parseInt(passingYear),
        currentOccupation: currentOccupation || null,
        currentEmployer:   currentEmployer   || null,
        currentCity:       currentCity       || null,
        contactEmail:      contactEmail      || null,
        contactPhone:      contactPhone      || null,
        willingToMentor:   willingToMentor   ?? false,
        notes:             notes             || null,
      },
      update: {
        passingYear:       parseInt(passingYear),
        currentOccupation: currentOccupation || null,
        currentEmployer:   currentEmployer   || null,
        currentCity:       currentCity       || null,
        contactEmail:      contactEmail      || null,
        contactPhone:      contactPhone      || null,
        willingToMentor:   willingToMentor   ?? false,
        notes:             notes             || null,
      },
    });

    // Manually fetch student info
    const student = await db.student.findUnique({
      where: { id: alumni.studentId },
      select: { fullName: true, admissionNumber: true },
    });

    return NextResponse.json({ success: true, data: { ...alumni, student } }, { status: 201 });
  } catch (error) {
    console.error('Alumni POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to register alumni' }, { status: 500 });
  }
}
