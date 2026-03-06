export const dynamic = 'force-dynamic';
import { getAuthContext, requireAccess } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/attendance/mark - Mark attendance for students
export async function POST(request: NextRequest) {
    const _denied = requireAccess(getAuthContext(request), {minLevel: 4 ?? 4});
  if (_denied) return _denied;

  try {
    const body = await request.json()
    const { date, classId, sectionId, attendanceRecords, markedBy } = body

    // Validate required fields
    if (!date || !attendanceRecords || attendanceRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Date and attendance records are required',
        },
        { status: 400 }
      )
    }

    // Batch create/update attendance records
    const results = await Promise.all(
      attendanceRecords.map(async (record: any) => {
        const { studentId, status, remarks } = record

        return await db.attendance.upsert({
          where: {
            studentId_date: {
              studentId,
              date: new Date(date),
            },
          },
          create: {
            studentId,
            classId,
            sectionId,
            date: new Date(date),
            status,
            remarks,
            markedBy,
          },
          update: {
            status,
            remarks,
            markedBy,
          },
        })
      })
    )

    // Calculate statistics
    const stats = {
      total: results.length,
      present: results.filter(r => r.status === 'Present').length,
      absent: results.filter(r => r.status === 'Absent').length,
      late: results.filter(r => r.status === 'Late').length,
      halfDay: results.filter(r => r.status === 'Half-day').length,
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance marked successfully',
        data: {
          attendance: results,
          stats,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/attendance - Get attendance with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const classId = searchParams.get('classId')
    const sectionId = searchParams.get('sectionId')
    const studentId = searchParams.get('studentId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const where: any = {}

    if (date) {
      where.date = new Date(date)
    }

    if (classId) {
      where.classId = classId
    }

    if (sectionId) {
      where.sectionId = sectionId
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (fromDate && toDate) {
      where.date = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      }
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
            section: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
