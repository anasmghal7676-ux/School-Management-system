export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const status = sp.get('status') || '';
    const type   = sp.get('type')   || '';
    const mode   = sp.get('mode')   || 'scholarships'; // 'scholarships' | 'awards'
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = parseInt(sp.get('limit') || '20');

    if (mode === 'awards') {
      const where: any = {};
      if (status) where.status = status;

      const [awards, total] = await Promise.all([
        (db as any).scholarshipAward.findMany({
          where,
          include: {
            scholarship: { select: { id: true, name: true, type: true, valueType: true, value: true } },
            student: { select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } } },
          },
          orderBy: { awardedDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        (db as any).scholarshipAward.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: { awards, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      });
    }

    const where: any = { schoolId: SCHOOL_ID };
    if (status) where.status = status;
    if (type)   where.type   = type;

    const [scholarships, total] = await Promise.all([
      (db as any).scholarship.findMany({
        where,
        include: {
          _count: { select: { awards: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (db as any).scholarship.count({ where }),
    ]);

    const [open, awarded, totalAwards] = await Promise.all([
      (db as any).scholarship.count({ where: { schoolId: SCHOOL_ID, status: 'Open' } }),
      (db as any).scholarship.count({ where: { schoolId: SCHOOL_ID, status: 'Awarded' } }),
      (db as any).scholarshipAward.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        scholarships,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { open, awarded, totalAwards, total },
      },
    });
  } catch (error) {
    console.error('Scholarships GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch scholarships' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'award') {
      // Award scholarship to student
      const { scholarshipId, studentId, startDate, amountAwarded, awardedBy, remarks, endDate } = body;
      if (!scholarshipId || !studentId || !startDate || !amountAwarded) {
        return NextResponse.json({ success: false, message: 'scholarshipId, studentId, startDate, amountAwarded required' }, { status: 400 });
      }

      const [award] = await Promise.all([
        (db as any).scholarshipAward.create({
          data: {
            scholarshipId,
            studentId,
            startDate:     new Date(startDate),
            endDate:       endDate ? new Date(endDate) : null,
            amountAwarded: parseFloat(amountAwarded),
            awardedBy:     awardedBy || null,
            remarks:       remarks || null,
            status:        'Active',
          },
          include: {
            student: { select: { fullName: true, admissionNumber: true } },
            scholarship: { select: { name: true } },
          },
        }),
        // Increment filled slots
        (db as any).scholarship.update({
          where: { id: scholarshipId },
          data:  { filledSlots: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ success: true, data: award }, { status: 201 });
    }

    // Create scholarship
    const { name, type, valueType, value, description, eligibility, academicYear, totalSlots, applicationDeadline } = body;
    if (!name) return NextResponse.json({ success: false, message: 'name required' }, { status: 400 });

    const scholarship = await (db as any).scholarship.create({
      data: {
        schoolId:            SCHOOL_ID,
        name,
        type:                type        || 'Merit',
        valueType:           valueType   || 'Percentage',
        value:               parseFloat(value || '0'),
        maxAmount:           body.maxAmount ? parseFloat(body.maxAmount) : null,
        description:         description || null,
        eligibility:         eligibility || null,
        academicYear:        academicYear || null,
        totalSlots:          totalSlots ? parseInt(totalSlots) : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        status:              'Open',
      },
    });

    return NextResponse.json({ success: true, data: scholarship }, { status: 201 });
  } catch (error) {
    console.error('Scholarships POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, awardId, ...updates } = body;

    if (awardId) {
      const award = await (db as any).scholarshipAward.update({
        where: { id: awardId },
        data: {
          status:  updates.status  || undefined,
          remarks: updates.remarks || undefined,
        },
      });
      return NextResponse.json({ success: true, data: award });
    }

    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const data: any = {};
    if (updates.name        !== undefined) data.name        = updates.name;
    if (updates.status      !== undefined) data.status      = updates.status;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.value       !== undefined) data.value       = parseFloat(updates.value);

    const scholarship = await (db as any).scholarship.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: scholarship });
  } catch (error) {
    console.error('Scholarships PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await (db as any).scholarship.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
