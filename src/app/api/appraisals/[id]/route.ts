import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appraisal = await (db as any).staffAppraisal.findUnique({
      where: { id: params.id },
      include: {
        staff: {
          select: {
            firstName: true, lastName: true, designation: true,
            employeeCode: true, department: { select: { name: true } },
          },
        },
      },
    });
    if (!appraisal) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: appraisal });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const ratings = [
      body.teachingSkills, body.punctuality, body.teamwork,
      body.communication, body.subjectKnowledge, body.studentEngagement, body.professionalism,
    ].filter(r => r != null && r > 0);

    const overallRating = ratings.length > 0
      ? parseFloat((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2))
      : undefined;

    const data: any = {};
    if (body.status)              data.status              = body.status;
    if (body.reviewDate)          data.reviewDate          = new Date(body.reviewDate);
    if (body.appraisalPeriod)     data.appraisalPeriod     = body.appraisalPeriod;
    if (overallRating)            data.overallRating       = overallRating;
    if (body.teachingSkills    != null) data.teachingSkills    = parseFloat(body.teachingSkills);
    if (body.punctuality       != null) data.punctuality       = parseFloat(body.punctuality);
    if (body.teamwork          != null) data.teamwork          = parseFloat(body.teamwork);
    if (body.communication     != null) data.communication     = parseFloat(body.communication);
    if (body.subjectKnowledge  != null) data.subjectKnowledge  = parseFloat(body.subjectKnowledge);
    if (body.studentEngagement != null) data.studentEngagement = parseFloat(body.studentEngagement);
    if (body.professionalism   != null) data.professionalism   = parseFloat(body.professionalism);
    if (body.strengths         !== undefined) data.strengths         = body.strengths;
    if (body.areasForImprovement !== undefined) data.areasForImprovement = body.areasForImprovement;
    if (body.goals             !== undefined) data.goals             = body.goals;
    if (body.reviewerComments  !== undefined) data.reviewerComments  = body.reviewerComments;
    if (body.staffComments     !== undefined) data.staffComments     = body.staffComments;

    const appraisal = await (db as any).staffAppraisal.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ success: true, data: appraisal });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await (db as any).staffAppraisal.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
