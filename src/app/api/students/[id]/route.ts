import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthContext, requireAccess } from '@/lib/api-auth'

// GET /api/students/[id] - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        parents: true,
        addresses: true,
        documents: true,
        feeAssignments: {
          include: {
            feeStructure: {
              include: {
                feeType: true,
              },
            },
          },
        },
        feePayments: {
          orderBy: { paymentDate: 'desc' },
          take: 10,
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: 'Student not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: student,
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch student',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Update full name if name fields changed
    if (body.firstName || body.lastName) {
      const existingStudent = await db.student.findUnique({
        where: { id },
        select: { firstName: true, middleName: true, lastName: true },
      })

      if (existingStudent) {
        body.fullName = `${body.firstName || existingStudent.firstName} ${
          body.middleName || existingStudent.middleName || ''
        } ${body.lastName || existingStudent.lastName}`.trim()
      }
    }

    const student = await db.student.update({
      where: { id },
      data: body,
      include: {
        class: true,
        section: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update student',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _auth = getAuthContext(req)
  const _denied = requireAccess(_auth, { minLevel: 5 })
  if (_denied) return _denied

  try {
    const { id } = await params

    await db.student.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete student',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
