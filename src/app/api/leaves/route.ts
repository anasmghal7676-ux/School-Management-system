export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/leaves - List leave applications
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const applicantType = searchParams.get('applicantType') || 'Staff';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where: any = {
      applicantType,
    };

    if (staffId) {
      where.userId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    if (fromDate && toDate) {
      where.OR = [
        {
          fromDate: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        },
        {
          toDate: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        },
      ];
    }

    const leaves = await db.leaveApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaves',
      },
      { status: 500 }
    );
  }
}

// POST /api/leaves - Submit leave application
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      applicantId,
      applicantType = 'Staff',
      leaveType,
      fromDate,
      toDate,
      days,
      reason,
      attachments,
      staffId,
    } = body;

    if (!applicantId || !leaveType || !fromDate || !toDate || !days || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    const leave = await db.leaveApplication.create({
      data: {
        userId: applicantId || staffId || 'unknown',
        staffId: staffId || null,
        applicantType,
        leaveType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        days,
        reason,
        status: 'Pending',
      },
      include: {
        user: true,
        staff: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting leave:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit leave application',
      },
      { status: 500 }
    );
  }
}
