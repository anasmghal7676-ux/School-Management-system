import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/classes/:id - Get single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cls = await db.class.findUnique({
      where: { id: (await params).id },
      include: {
        sections: {
          include: {
            classTeacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cls,
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

// PUT /api/classes/:id - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { name, code, level, numericValue, capacity, description } = body;

    // Check if class exists
    const existingClass = await db.class.findUnique({
      where: { id: (await params).id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if new code conflicts with another class
    if (code && code !== existingClass.code) {
      const codeConflict = await db.class.findUnique({
        where: { code },
      });

      if (codeConflict) {
        return NextResponse.json(
          { success: false, error: 'Class code already exists' },
          { status: 400 }
        );
      }
    }

    const updatedClass = await db.class.update({
      where: { id: (await params).id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(level && { level }),
        ...(numericValue && { numericValue: parseInt(numericValue) }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedClass,
      message: 'Class updated successfully',
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/:id - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if class exists
    const existingClass = await db.class.findUnique({
      where: { id: (await params).id },
      include: {
        _count: {
          select: {
            students: true,
            sections: true,
          },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if class has students or sections
    if (existingClass._count.students > 0 || existingClass._count.sections > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete class with existing students or sections',
        },
        { status: 400 }
      );
    }

    await db.class.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
