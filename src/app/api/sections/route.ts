import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sections - Get all sections
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');

    const sections = await db.section.findMany({
      where: classId ? { classId } : undefined,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        {
          class: {
            numericValue: 'asc',
          },
        },
        {
          name: 'asc',
        },
      ],
    });

    const transformedSections = sections.map((section) => ({
      id: section.id,
      name: section.name,
      code: section.code,
      roomNumber: section.roomNumber,
      capacity: section.capacity,
      classId: section.classId,
      className: section.class.name,
      classTeacherId: section.classTeacherId,
      classTeacherName: section.classTeacher
        ? `${section.classTeacher.firstName} ${section.classTeacher.lastName}`
        : null,
      studentCount: section._count.students,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSections,
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, name, code, roomNumber, capacity, classTeacherId } = body;

    // Validation
    if (!classId || !name || !code || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if class exists
    const existingClass = await db.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if section with same name already exists for this class
    const existingSection = await db.section.findUnique({
      where: {
        classId_name: {
          classId,
          name,
        },
      },
    });

    if (existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section with this name already exists for this class' },
        { status: 400 }
      );
    }

    const newSection = await db.section.create({
      data: {
        classId,
        name,
        code,
        roomNumber: roomNumber || null,
        capacity: parseInt(capacity),
        classTeacherId: classTeacherId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: newSection,
      message: 'Section created successfully',
    });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
