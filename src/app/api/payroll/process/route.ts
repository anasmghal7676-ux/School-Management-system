export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/payroll/process - Batch update payroll status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, processedBy, paymentMode, paymentDate } = body;

    if (!ids?.length || !action) {
      return NextResponse.json(
        { success: false, message: 'ids and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['process', 'pay', 'reset'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      process: 'Processed',
      pay: 'Paid',
      reset: 'Pending',
    };

    const updateData: any = {
      status: statusMap[action],
    };

    if (action === 'process') {
      updateData.processedBy = processedBy || 'System';
    }

    if (action === 'pay') {
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      updateData.paymentMode = paymentMode || 'Bank Transfer';
      updateData.processedBy = processedBy || 'System';
    }

    const result = await db.payroll.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
      message: `${result.count} payroll records updated to ${statusMap[action]}`,
    });
  } catch (error) {
    console.error('Payroll process error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payroll' },
      { status: 500 }
    );
  }
}
