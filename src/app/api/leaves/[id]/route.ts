export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/leaves/:id - Get single leave application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const leave = await db.leaveApplication.findUnique({
      where: { id },
      include: {
        user: true,
        staff: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!leave) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave application not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leave,
    });
  } catch (error) {
    console.error('Error fetching leave application:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave application',
      },
      { status: 500 }
    );
  }
}

// PUT /api/leaves/:id/approve - Approve leave application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approvedBy, remarks } = body;

    const updated = await db.leaveApplication.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy,
        approvalDate: new Date(),
        remarks,
      },
      include: {
        user: true,
        staff: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Leave application approved',
    });
  } catch (error) {
    console.error('Error approving leave:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve leave application',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/leaves/:id - Reject/Delete leave application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approvedBy, remarks, reject = false } = body;

    if (reject) {
      // Reject instead of delete
      const updated = await db.leaveApplication.update({
        where: { id },
        data: {
          status: 'Rejected',
          approvedBy,
          remarks,
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Leave application rejected',
      });
    } else {
      // Delete the application
      await db.leaveApplication.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Leave application deleted',
      });
    }
  } catch (error) {
    console.error('Error processing leave application:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process leave application',
      },
      { status: 500 }
    );
  }
}
