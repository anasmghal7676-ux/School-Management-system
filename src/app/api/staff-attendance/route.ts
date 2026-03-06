export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff-att - Get staff attendance records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const date = searchParams.get('date');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (date) {
      where.date = new Date(date);
    }

    if (fromDate && toDate) {
      where.date = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    if (status) {
      where.status = status;
    }

    const attendance = await db.staffAttendance.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            fullName: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Filter by department if specified
    let filteredAttendance = attendance;
    if (departmentId) {
      filteredAttendance = attendance.filter(
        (a) => a.staff.departmentId === departmentId
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredAttendance,
    });
  } catch (error) {
    console.error('Error fetching staff attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staff attendance',
      },
      { status: 500 }
    );
  }
}

// POST /api/staff-att - Mark attendance for multiple staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, attendanceRecords, markedBy } = body;

    if (!date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date and attendance records are required',
        },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    const createdRecords = [] as any[];

    // Process each attendance record
    for (const record of attendanceRecords) {
      const { staffId, status, checkInTime, checkOutTime, remarks } = record;

      // Check if attendance already exists for this staff and date
      const existing = await db.staffAttendance.findUnique({
        where: {
          staffId_date: {
            staffId,
            date: attendanceDate,
          },
        },
      });

      if (existing) {
        // Update existing record
        const updated = await db.staffAttendance.update({
          where: {
            id: existing.id,
          },
          data: {
            status,
            checkInTime: checkInTime ? new Date(checkInTime) : null,
            checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
            remarks,
            markedBy,
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
        createdRecords.push(updated);
      } else {
        // Create new record
        const created = await db.staffAttendance.create({
          data: {
            staffId,
            date: attendanceDate,
            status,
            checkInTime: checkInTime ? new Date(checkInTime) : null,
            checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
            remarks,
            markedBy,
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
        createdRecords.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      data: createdRecords,
      message: `Attendance marked for ${createdRecords.length} staff members`,
    });
  } catch (error) {
    console.error('Error marking staff attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark staff attendance',
      },
      { status: 500 }
    );
  }
}
