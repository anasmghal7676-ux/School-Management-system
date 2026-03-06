export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAccess, ROLE_LEVELS } from '@/lib/api-auth';
import { db } from '@/lib/db';

// GET /api/classes - Get all classes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');

    const classes = await db.class.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: {
        _count: {
          select: {
            sections: true,
            students: true,
          },
        },
      },
      orderBy: {
        numericValue: 'asc',
      },
    });

    const transformedClasses = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      level: cls.level,
      numericValue: cls.numericValue,
      capacity: cls.capacity,
      description: cls.description,
      sectionCount: cls._count.sections,
      studentCount: cls._count.students,
    }));

    return NextResponse.json({
      success: true,
      data: transformedClasses,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create new class
export async function POST(request: NextRequest) {
    const _denied = requireAccess(getAuthContext(request), {minLevel: ROLE_LEVELS.TEACHER});
  if (_denied) return _denied;

  try {
    const body = await request.json();
    const { name, code, level, numericValue, capacity, description, schoolId } = body;

    // Validation
    if (!name || !code || !level || !numericValue || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if class code already exists
    const existingClass = await db.class.findUnique({
      where: { code },
    });

    if (existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class code already exists' },
        { status: 400 }
      );
    }

    const newClass = await db.class.create({
      data: {
        name,
        code,
        level,
        numericValue: parseInt(numericValue),
        capacity: parseInt(capacity),
        description: description || null,
        schoolId: schoolId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: newClass,
      message: 'Class created successfully',
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
