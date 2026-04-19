export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// We implement admissions as students with status='pending' progressing through stages
// Stages: inquiry → applied → document_review → interview → approved → enrolled → rejected

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp     = request.nextUrl.searchParams;
    const stage  = sp.get('stage')  || '';
    const classId = sp.get('classId') || '';
    const search = sp.get('search') || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = Math.min(parseInt(sp.get('limit') || '25'), 200);

    // Pending/applied students = admission pipeline
    const statusMap: Record<string, string[]> = {
      inquiry:         ['inquiry'],
      applied:         ['applied'],
      document_review: ['document_review'],
      interview:       ['interview'],
      approved:        ['approved'],
      rejected:        ['rejected'],
    };

    const statuses = stage && statusMap[stage] ? statusMap[stage] : ['inquiry','applied','document_review','interview','approved','rejected'];

    const where: any = { status: { in: statuses } };
    if (classId) where.currentClassId = classId;
    if (search) {
      where.OR = [
        { fullName:        { contains: search } },
        { admissionNumber: { contains: search } },
        { fatherName:      { contains: search } },
        { contactNumber:   { contains: search } },
      ];
    }

    const [applicants, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          class:   { select: { name: true } },
          section: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.student.count({ where }),
    ]);

    // Stage counts
    const stageCounts = await Promise.all(
      Object.entries(statusMap).map(async ([stage, statuses]) => ({
        stage,
        count: await db.student.count({ where: { status: { in: statuses } } }),
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        applicants,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stageCounts: Object.fromEntries(stageCounts.map(s => [s.stage, s.count])),
      },
    });
  } catch (error) {
    console.error('Admissions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admissions' }, { status: 500 });
  }
}

// Create new admission application
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      fullName, gender, dateOfBirth, fatherName, motherName, fatherOccupation,
      contactNumber, alternateContact, email, address, city, province,
      currentClassId, previousSchool, religion, bloodGroup, remarks,
    } = body;

    if (!fullName || !gender || !currentClassId) {
      return NextResponse.json(
        { success: false, message: 'fullName, gender and currentClassId are required' },
        { status: 400 }
      );
    }

    // Auto-generate temp admission number for applications
    const count = await db.student.count({ where: { status: { in: ['inquiry','applied','document_review','interview','approved','rejected'] } } });
    const admissionNumber = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const nameParts = fullName?.trim().split(' ') || [];
    const firstName = nameParts[0] || fullName || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '-';
    const applicant = await db.student.create({
      data: {
        schoolId: process.env.SCHOOL_ID || 'school_main',
        firstName,
        lastName,
        fullName:          fullName || `${firstName} ${lastName}`,
        admissionNumber,
        rollNumber:        admissionNumber,
        gender,
        dateOfBirth:       dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
        fatherName:        fatherName   || null,
        motherName:        motherName   || null,
        fatherOccupation:  fatherOccupation || null,
        fatherPhone:       contactNumber || '0000000000',
        email:             email           || null,
        address:           address         || null,
        city:              city            || null,
        province:          province        || null,
        currentClassId,
        religion:          religion        || 'Islam',
        bloodGroup:        bloodGroup      || null,
        remarks:           remarks         || null,
        status:            'applied',
      },
      include: {
        class: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: applicant }, { status: 201 });
  } catch (error: any) {
    console.error('Admissions POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create application' }, { status: 500 });
  }
}
