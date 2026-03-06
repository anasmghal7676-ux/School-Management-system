export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff-att/:id - Get single attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendance = await db.staffAttendance.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance record',
      },
      { status: 500 }
    );
  }
}

// PUT /api/staff-att/:id - Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, checkInTime, checkOutTime, remarks } = body;

    const updated = await db.staffAttendance.update({
      where: { id },
      data: {
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        remarks,
        updatedAt: new Date(),
      },
      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            fullName: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Attendance updated successfully',
    });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update attendance record',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/staff-att/:id - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.staffAttendance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attendance record',
      },
      { status: 500 }
    );
  }
}
