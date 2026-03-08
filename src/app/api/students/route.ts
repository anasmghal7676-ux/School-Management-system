export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/students
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const sectionId = searchParams.get('sectionId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { fatherName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (classId) where.currentClassId = classId;
    if (sectionId) where.currentSectionId = sectionId;
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: { class: true, section: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: students, total, page, limit });
  } catch (error: any) {
    console.error('GET /api/students error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { firstName, lastName, gender, dateOfBirth, currentClassId } = body;
    if (!firstName || !lastName || !gender || !dateOfBirth || !currentClassId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: firstName, lastName, gender, dateOfBirth, currentClassId' },
        { status: 400 }
      );
    }

    // Auto-generate admission number
    const year = new Date().getFullYear();
    const lastStudent = await db.student.findFirst({
      where: { admissionNumber: { startsWith: `${year}-` } },
      orderBy: { admissionNumber: 'desc' },
    });
    const seq = lastStudent
      ? parseInt(lastStudent.admissionNumber.split('-')[1] || '0') + 1
      : 1;
    const admissionNumber = `${year}-${String(seq).padStart(4, '0')}`;

    const fullName = [firstName, body.middleName, lastName].filter(Boolean).join(' ');

    const student = await db.student.create({
      data: {
        admissionNumber,
        firstName,
        middleName: body.middleName || null,
        lastName,
        fullName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        phone: body.phone || null,
        email: body.email || null,
        fatherName: body.fatherName || null,
        motherName: body.motherName || null,
        fatherPhone: body.fatherPhone || null,
        motherPhone: body.motherPhone || null,
        address: body.address || null,
        city: body.city || null,
        province: body.province || null,
        religion: body.religion || null,
        bloodGroup: body.bloodGroup || null,
        nationality: body.nationality || 'Pakistani',
        bForm: body.bForm || null,
        rollNumber: body.rollNumber || null,
        admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
        status: body.status || 'active',
        currentClassId,
        currentSectionId: body.currentSectionId || null,
        academicYearId: body.academicYearId || null,
        previousSchool: body.previousSchool || null,
        medicalConditions: body.medicalConditions || null,
      },
      include: { class: true, section: true },
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/students error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
