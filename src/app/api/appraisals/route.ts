import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const staffId = sp.get('staffId') || '';
    const period  = sp.get('period')  || '';
    const status  = sp.get('status')  || '';
    const page    = parseInt(sp.get('page')  || '1');
    const limit   = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (staffId) where.staffId         = staffId;
    if (period)  where.appraisalPeriod = period;
    if (status)  where.status          = status;

    const [appraisals, total] = await Promise.all([
      (db as any).staffAppraisal.findMany({
        where,
        include: {
          staff: {
            select: {
              id: true, firstName: true, lastName: true,
              designation: true, employeeCode: true,
              department: { select: { name: true } },
            },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: [{ reviewDate: 'desc' }],
      }),
      (db as any).staffAppraisal.count({ where }),
    ]);

    // Summary stats
    const allAppraisals = await (db as any).staffAppraisal.findMany({
      where: period ? { appraisalPeriod: period } : {},
      select: { overallRating: true },
    });
    const avgRating = allAppraisals.length > 0
      ? allAppraisals.reduce((s: number, a: any) => s + a.overallRating, 0) / allAppraisals.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        appraisals,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { avgRating: parseFloat(avgRating.toFixed(2)), count: total },
      },
    });
  } catch (error) {
    console.error('Appraisals GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch appraisals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      staffId, reviewerId, appraisalPeriod, reviewDate,
      teachingSkills, punctuality, teamwork, communication,
      subjectKnowledge, studentEngagement, professionalism,
      strengths, areasForImprovement, goals,
      reviewerComments, status = 'Draft',
    } = body;

    if (!staffId || !appraisalPeriod || !reviewDate) {
      return NextResponse.json(
        { success: false, message: 'staffId, appraisalPeriod and reviewDate required' },
        { status: 400 }
      );
    }

    // Calculate overall rating as average of provided categories
    const ratings = [teachingSkills, punctuality, teamwork, communication, subjectKnowledge, studentEngagement, professionalism]
      .filter(r => r != null && r > 0);
    const overallRating = ratings.length > 0
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : 3;

    const appraisal = await (db as any).staffAppraisal.create({
      data: {
        staffId,
        reviewerId:        reviewerId || null,
        appraisalPeriod,
        reviewDate:        new Date(reviewDate),
        overallRating:     parseFloat(overallRating.toFixed(2)),
        status,
        teachingSkills:    teachingSkills    ? parseFloat(teachingSkills)    : null,
        punctuality:       punctuality       ? parseFloat(punctuality)       : null,
        teamwork:          teamwork          ? parseFloat(teamwork)          : null,
        communication:     communication     ? parseFloat(communication)     : null,
        subjectKnowledge:  subjectKnowledge  ? parseFloat(subjectKnowledge)  : null,
        studentEngagement: studentEngagement ? parseFloat(studentEngagement) : null,
        professionalism:   professionalism   ? parseFloat(professionalism)   : null,
        strengths:         strengths         || null,
        areasForImprovement: areasForImprovement || null,
        goals:             goals             || null,
        reviewerComments:  reviewerComments  || null,
      },
      include: {
        staff: { select: { firstName: true, lastName: true, designation: true } },
      },
    });

    return NextResponse.json({ success: true, data: appraisal }, { status: 201 });
  } catch (error) {
    console.error('Appraisals POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create appraisal' }, { status: 500 });
  }
}
