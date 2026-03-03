import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sections/:id - Get single section
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await db.section.findUnique({
      where: { id: params.id },
      include: {
        class: true,
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
          },
        },
        students: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
          },
          orderBy: {
            rollNumber: 'asc',
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PUT /api/sections/:id - Update section
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, code, roomNumber, capacity, classTeacherId } = body;

    // Check if section exists
    const existingSection = await db.section.findUnique({
      where: { id: params.id },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another section in the same class
    if (name && name !== existingSection.name) {
      const nameConflict = await db.section.findUnique({
        where: {
          classId_name: {
            classId: existingSection.classId,
            name,
          },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Section with this name already exists for this class' },
          { status: 400 }
        );
      }
    }

    const updatedSection = await db.section.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(roomNumber !== undefined && { roomNumber: roomNumber || null }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(classTeacherId !== undefined && { classTeacherId: classTeacherId || null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSection,
      message: 'Section updated successfully',
    });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/:id - Delete section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if section exists
    const existingSection = await db.section.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check if section has students
    if (existingSection._count.students > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete section with existing students',
        },
        { status: 400 }
      );
    }

    await db.section.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
