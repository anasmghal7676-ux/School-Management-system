export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff-att/summary - Get attendance summary for a date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const departmentId = searchParams.get('departmentId');

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date is required',
        },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);

    // Get all staff for the department (or all if no department specified)
    const staffWhere: any = {
      status: 'active',
    };

    if (departmentId) {
      staffWhere.departmentId = departmentId;
    }

    const allStaff = await db.staff.findMany({
      where: staffWhere,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        designation: true,
        departmentId: true,
        department: true,
      },
    });

    // Get attendance for the date
    const attendanceRecords = await db.staffAttendance.findMany({
      where: {
        date: attendanceDate,
      },
      include: {
        staff: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            designation: true,
            departmentId: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const attendanceMap = new Map(
      attendanceRecords.map((r) => [r.staffId, r])
    );

    // Calculate summary
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let onLeave = 0;
    let notMarked = 0;

    const staffWithAttendance = allStaff.map((staff) => {
      const attendance = attendanceMap.get(staff.id);
      const status = attendance?.status || 'Not Marked';

      switch (status) {
        case 'Present':
          present++;
          break;
        case 'Absent':
          absent++;
          break;
        case 'Late':
          late++;
          break;
        case 'Half-day':
          halfDay++;
          break;
        case 'Leave':
          onLeave++;
          break;
        default:
          notMarked++;
      }

      return {
        ...staff,
        attendance: attendance || null,
        status,
      };
    });

    // Filter by department if specified
    let finalResult = staffWithAttendance;
    if (departmentId) {
      finalResult = staffWithAttendance.filter((s) => s.departmentId === departmentId);
    }

    const total = finalResult.length;
    const markedCount = total - notMarked;
    const attendancePercentage = total > 0 ? ((markedCount / total) * 100).toFixed(1) : 0;

    return NextResponse.json({
      success: true,
      data: {
        date: attendanceDate,
        summary: {
          total,
          present,
          absent,
          late,
          halfDay,
          onLeave,
          notMarked,
          markedCount,
          attendancePercentage: parseFloat(attendancePercentage),
        },
        staff: finalResult,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance summary',
      },
      { status: 500 }
    );
  }
}
