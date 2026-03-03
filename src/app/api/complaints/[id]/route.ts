import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, assignedTo, resolution, priority } = body;

    const data: any = {};
    if (status     !== undefined) data.status     = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (resolution !== undefined) data.resolution = resolution;
    if (priority   !== undefined) data.priority   = priority;
    if (status === 'Resolved' || status === 'Closed') {
      data.resolvedDate = new Date();
    }

    const complaint = await db.complaint.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true, data: complaint });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.complaint.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
