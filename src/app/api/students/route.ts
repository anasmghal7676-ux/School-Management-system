export const dynamic = 'force-dynamic';
import { getAuthContext, requireAccess } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

import { StudentSchema } from '@/lib/validations/student'

// GET /api/students - List all students with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const classId = searchParams.get('classId') || ''
    const sectionId = searchParams.get('sectionId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { fatherName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    if (classId) {
      where.currentClassId = classId
    }

    if (sectionId) {
      where.currentSectionId = sectionId
    }

    if (status) {
      where.status = status
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          class: true,
          section: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { admissionNumber: 'asc' },
      }),
      db.student.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch students',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/students - Create new student
export async function POST(request: NextRequest) {
    const _denied = requireAccess(getAuthContext(request), {minLevel: 4 ?? 4});
  if (_denied) return _denied;

  try {
    const body = await request.json()

  // Validate with Zod
  const parsed = StudentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: 'Validation error',
      details: parsed.error.flatten().fieldErrors,
    }, { status: 400 })
  }

    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'gender',
      'dateOfBirth',
      'fatherName',
      'fatherPhone',
      'address',
      'city',
      'province',
      'currentClassId',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `Missing required field: ${field}`,
          },
          { status: 400 }
        )
      }
    }

    // Generate admission number
    const year = new Date().getFullYear()
    const lastStudent = await db.student.findFirst({
      where: {
        admissionNumber: {
          startsWith: `${year}-`,
        },
      },
      orderBy: { admissionNumber: 'desc' },
    })

    const lastNumber = lastStudent
      ? parseInt(lastStudent.admissionNumber.split('-')[1])
      : 0
    const admissionNumber = `${year}-${String(lastNumber + 1).padStart(4, '0')}`

    // Generate full name
    const fullName = `${body.firstName} ${body.middleName || ''} ${body.lastName}`.trim()

    // Create student
    const student = await db.student.create({
      data: {
        ...body,
        admissionNumber,
        fullName,
        admissionDate: new Date(),
        status: body.status || 'active',
      },
      include: {
        class: true,
        section: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Student created successfully',
        data: student,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create student',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
