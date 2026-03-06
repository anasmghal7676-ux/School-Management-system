export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const log = await db.studentBehaviorLog.update({
      where: { id: (await params).id },
      data: {
        ...(body.incidentType  && { incidentType:  body.incidentType }),
        ...(body.description   && { description:   body.description }),
        ...(body.actionTaken   !== undefined && { actionTaken: body.actionTaken }),
        ...(body.reportedBy    && { reportedBy:    body.reportedBy }),
        ...(body.incidentDate  && { incidentDate:  new Date(body.incidentDate) }),
      },
    });
    return NextResponse.json({ success: true, data: log });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.studentBehaviorLog.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
