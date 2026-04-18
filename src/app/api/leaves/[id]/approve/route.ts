export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireLevel } from '@/lib/api-auth';

// PATCH /api/leaves/[id]/approve — Approved a leave application
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, ctx } = await requireAuth();
  if (error) return error;

  // Only Coordinator+ can approve/reject leaves
  if (!requireLevel(ctx, 5)) {
    return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const remarks = body.remarks || '';

    const leave = await db.leaveApplication.findUnique({ where: { id } });
    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave application not found' }, { status: 404 });
    }
    if (leave.status !== 'Pending') {
      return NextResponse.json({ success: false, error: `Leave is already ${leave.status}` }, { status: 400 });
    }

    const updated = await db.leaveApplication.update({
      where: { id },
      data: {
        status:       'Approved',
        approvedBy:   ctx.id,
        approvalDate: new Date(),
        remarks:      remarks || leave.remarks,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Leave approved successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
