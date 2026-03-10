export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  try {
    const sp       = request.nextUrl.searchParams;
    const status   = sp.get('status')   || '';
    const severity = sp.get('severity') || '';
    const type     = sp.get('type')     || '';
    const search   = sp.get('search')   || '';
    const page     = parseInt(sp.get('page')  || '1');
    const limit    = parseInt(sp.get('limit') || '20');

    const where: any = { schoolId: SCHOOL_ID };
    if (status)   where.status       = status;
    if (severity) where.severity     = severity;
    if (type)     where.incidentType = type;
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reportedBy:  { contains: search, mode: 'insensitive' } },
        { location:    { contains: search, mode: 'insensitive' } },
      ];
    }

    const [incidents, total] = await Promise.all([
      (db as any).incidentReport.findMany({
        where,
        orderBy: [{ incidentDate: 'desc' }, { severity: 'desc' }],
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      (db as any).incidentReport.count({ where }),
    ]);

    // Summary stats
    const [open, underReview, resolved, critical] = await Promise.all([
      (db as any).incidentReport.count({ where: { schoolId: SCHOOL_ID, status: 'Open' } }),
      (db as any).incidentReport.count({ where: { schoolId: SCHOOL_ID, status: 'Under-Review' } }),
      (db as any).incidentReport.count({ where: { schoolId: SCHOOL_ID, status: 'Resolved' } }),
      (db as any).incidentReport.count({ where: { schoolId: SCHOOL_ID, severity: 'Critical' } }),
    ]);

    const typeBreakdown = await (db as any).incidentReport.groupBy({
      by: ['incidentType'],
      _count: true,
      orderBy: { _count: { incidentType: 'desc' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { open, underReview, resolved, critical, typeBreakdown },
      },
    });
  } catch (error) {
    console.error('Incidents GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, incidentDate, reportedBy, location, incidentType, severity,
      description, witnesses, actionTaken, followUpDate, followUpNotes,
      studentsInvolved, staffInvolved, parentNotified,
    } = body;

    if (!title || !incidentDate || !reportedBy || !incidentType || !description) {
      return NextResponse.json({ success: false, message: 'title, incidentDate, reportedBy, incidentType and description required' }, { status: 400 });
    }

    const incident = await (db as any).incidentReport.create({
      data: {
        schoolId:        SCHOOL_ID,
        title,
        incidentDate:    new Date(incidentDate),
        reportedBy,
        location:        location       || null,
        incidentType,
        severity:        severity       || 'Low',
        description,
        witnesses:       witnesses      || null,
        actionTaken:     actionTaken    || null,
        followUpDate:    followUpDate   ? new Date(followUpDate) : null,
        followUpNotes:   followUpNotes  || null,
        studentsInvolved: studentsInvolved || [],
        staffInvolved:   staffInvolved  || [],
        parentNotified:  parentNotified || false,
        status:          'Open',
      },
    });

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error) {
    console.error('Incidents POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create incident report' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const incident = await (db as any).incidentReport.update({
      where: { id },
      data: {
        status:          updates.status,
        actionTaken:     updates.actionTaken,
        followUpDate:    updates.followUpDate    ? new Date(updates.followUpDate)  : undefined,
        followUpNotes:   updates.followUpNotes,
        parentNotified:  updates.parentNotified,
        parentNotifiedAt: updates.parentNotified ? new Date() : undefined,
        severity:        updates.severity,
        description:     updates.description,
        witnesses:       updates.witnesses,
      },
    });

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    console.error('Incidents PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await (db as any).incidentReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Incidents DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
