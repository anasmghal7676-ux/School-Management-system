import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, requireAccess } from '@/lib/api-auth'

// GET /api/staff/:id - Get single staff
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await db.staff.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            lastLogin: true,
            role: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        timetable: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                class: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            classTeacher: true,
            timetable: true,
            staffAttendance: true,
            leaveApplications: true,
            payroll: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// PUT /api/staff/:id - Update staff
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      alternatePhone,
      email,
      designation,
      departmentId,
      qualification,
      experienceYears,
      joiningDate,
      salary,
      employmentType,
      cnicNumber,
      address,
      bankAccount,
      bankName,
      status,
    } = body;

    // Check if staff exists
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    // Check if new email conflicts with another staff member
    if (email && email !== existingStaff.email) {
      const emailConflict = await db.staff.findUnique({
        where: { email },
      });

      if (emailConflict) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const updatedStaff = await db.staff.update({
      where: { id: params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(gender && { gender }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(phone && { phone }),
        ...(alternatePhone !== undefined && { alternatePhone: alternatePhone || null }),
        ...(email && { email }),
        ...(designation && { designation }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(qualification !== undefined && { qualification: qualification || null }),
        ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears) }),
        ...(joiningDate && { joiningDate: new Date(joiningDate) }),
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
        ...(employmentType && { employmentType }),
        ...(cnicNumber !== undefined && { cnicNumber: cnicNumber || null }),
        ...(address !== undefined && { address: address || null }),
        ...(bankAccount !== undefined && { bankAccount: bankAccount || null }),
        ...(bankName !== undefined && { bankName: bankName || null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStaff,
      message: 'Staff updated successfully',
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staff' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/:id - Delete staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const _auth = getAuthContext(req)
  const _denied = requireAccess(_auth, { minLevel: 5 })
  if (_denied) return _denied

  try {
    // Check if staff exists
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            classTeacher: true,
            timetable: true,
            staffAttendance: true,
            leaveApplications: true,
            payroll: true,
          },
        },
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff not found' },
        { status: 404 }
      );
    }

    // Check if staff has related records
    const relatedRecords = existingStaff._count;
    if (
      relatedRecords.classTeacher > 0 ||
      relatedRecords.timetable > 0 ||
      relatedRecords.staffAttendance > 0 ||
      relatedRecords.leaveApplications > 0 ||
      relatedRecords.payroll > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete staff with related records. Please archive instead.',
        },
        { status: 400 }
      );
    }

    // Delete user account if exists
    if (existingStaff.userId) {
      await db.user.delete({
        where: { id: existingStaff.userId },
      });
    }

    await db.staff.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff' },
      { status: 500 }
    );
  }
}
