export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp           = request.nextUrl.searchParams;
    const academicYear = sp.get('academicYear') || '';
    const page         = parseInt(sp.get('page')  || '1');
    const limit        = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (academicYear) where.academicYear = academicYear;

    const [records, total] = await Promise.all([
      (db as any).classPromotion.findMany({
        where,
        include: {
          student:   { select: { id: true, fullName: true, admissionNumber: true, rollNumber: true } },
          fromClass: { select: { id: true, name: true } },
          toClass:   { select: { id: true, name: true } },
        },
        orderBy: { promotedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      (db as any).classPromotion.count({ where }),
    ]);

    // Type summary
    const typeSummary = await (db as any).classPromotion.groupBy({
      by: ['promotionType'],
      where: academicYear ? { academicYear } : undefined,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: { records, total, typeSummary, pagination: { page, limit, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Promotions GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch promotion records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body             = await request.json();
    const { studentIds, promotions, academicYear, promotedBy } = body;
    // promotions: [{ studentId, fromClassId, toClassId, fromSectionId, toSectionId, promotionType, remarks }]

    if (!promotions?.length || !academicYear) {
      return NextResponse.json({ success: false, message: 'promotions array and academicYear required' }, { status: 400 });
    }

    let promoted = 0, heldBack = 0, graduated = 0, errors = 0;

    for (const p of promotions) {
      try {
        // Create promotion record
        await (db as any).classPromotion.create({
          data: {
            studentId:     p.studentId,
            fromClassId:   p.fromClassId,
            toClassId:     p.toClassId    || null,
            fromSectionId: p.fromSectionId || null,
            toSectionId:   p.toSectionId   || null,
            promotionType: p.promotionType,
            academicYear,
            promotedBy:    promotedBy || null,
            remarks:       p.remarks  || null,
          },
        });

        // Update student's current class if promoted or graduated
        if (p.promotionType === 'Promoted' && p.toClassId) {
          await db.student.update({
            where: { id: p.studentId },
            data:  {
              currentClassId:   p.toClassId,
              currentSectionId: p.toSectionId || null,
            },
          });
          promoted++;
        } else if (p.promotionType === 'Graduated') {
          await db.student.update({
            where: { id: p.studentId },
            data:  { status: 'graduated' },
          });
          graduated++;
        } else if (p.promotionType === 'Held-Back') {
          heldBack++;
        }
      } catch (err) {
        console.error('Promotion error for student:', p.studentId, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { promoted, heldBack, graduated, errors, total: promotions.length },
    }, { status: 201 });
  } catch (error) {
    console.error('Promotions POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process promotions' }, { status: 500 });
  }
}
