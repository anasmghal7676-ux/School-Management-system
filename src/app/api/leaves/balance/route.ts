export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/leaves/balance/:staffId - Get leave balance for staff member
export async function GET(
  request: NextRequest,

) {
  try {
    const staffId = request.nextUrl.searchParams.get('staffId') || '';
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Pakistani leave policy defaults
    const LEAVE_BALANCES = {
      Sick: { total: 10, used: 0 },
      Casual: { total: 10, used: 0 },
      Emergency: { total: 5, used: 0 },
      Annual: { total: 30, used: 0 },
      Maternity: { total: 90, used: 0 },
      Paternity: { total: 7, used: 0 },
    };

    // Calculate used days from approved leaves
    const approvedLeaves = await db.leaveApplication.findMany({
      where: {
        applicantId: staffId,
        applicantType: 'Staff',
        status: 'Approved',
        fromDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    approvedLeaves.forEach((leave) => {
      const leaveType = leave.leaveType as keyof typeof LEAVE_BALANCES;
      if (LEAVE_BALANCES[leaveType]) {
        LEAVE_BALANCES[leaveType].used += leave.days;
      }
    });

    // Calculate balances and carryforward for annual leave
    const balances = Object.entries(LEAVE_BALANCES).map(([type, data]) => {
      let carryForward = 0;
      const balance = data.total - data.used;

      // Carry forward for annual leave only
      if (type === 'Annual' && balance > 0) {
        carryForward = Math.min(balance, 10); // Max 10 days carry forward
      }

      return {
        leaveType: type,
        totalAllowed: data.total,
        used: data.used,
        balance: balance,
        carryForward: carryForward,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        staffId,
        year,
        balances,
      },
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave balance',
      },
      { status: 500 }
    );
  }
}
