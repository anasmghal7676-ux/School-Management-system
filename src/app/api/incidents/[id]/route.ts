import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const incident = await (db as any).incidentReport.findUnique({
      where: { id: (await params).id },
    });
    if (!incident) {
      return NextResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    console.error('Incident GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch incident' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const updateData: any = {};

    // Only update fields that are present in body
    if (body.title         !== undefined) updateData.title           = body.title;
    if (body.incidentDate  !== undefined) updateData.incidentDate    = new Date(body.incidentDate);
    if (body.reportedBy    !== undefined) updateData.reportedBy      = body.reportedBy;
    if (body.location      !== undefined) updateData.location        = body.location;
    if (body.incidentType  !== undefined) updateData.incidentType    = body.incidentType;
    if (body.severity      !== undefined) updateData.severity        = body.severity;
    if (body.description   !== undefined) updateData.description     = body.description;
    if (body.witnesses     !== undefined) updateData.witnesses       = body.witnesses;
    if (body.actionTaken   !== undefined) updateData.actionTaken     = body.actionTaken;
    if (body.followUpNotes !== undefined) updateData.followUpNotes   = body.followUpNotes;
    if (body.status        !== undefined) updateData.status          = body.status;
    if (body.followUpDate  !== undefined) updateData.followUpDate    = body.followUpDate ? new Date(body.followUpDate) : null;
    if (body.parentNotified !== undefined) {
      updateData.parentNotified   = body.parentNotified;
      if (body.parentNotified)   updateData.parentNotifiedAt = new Date();
    }

    const incident = await (db as any).incidentReport.update({
      where: { id: (await params).id },
      data:  updateData,
    });

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    console.error('Incident PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update incident' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await (db as any).incidentReport.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Incident DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete incident' }, { status: 500 });
  }
}
