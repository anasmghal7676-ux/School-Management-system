export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const log = await db.studentBehaviorLog.update({
      where: { id: (await params).id },
      data: {
        ...(body.incidentType !== undefined && { incidentType: body.incidentType }),
        ...(body.description  !== undefined && { description:  body.description }),
        ...(body.actionTaken  !== undefined && { actionTaken:  body.actionTaken }),
      },
    });
    return NextResponse.json({ success: true, data: log });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.studentBehaviorLog.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
