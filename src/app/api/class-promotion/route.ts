export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireLevel } from '@/lib/api-auth';

// POST /api/class-promotion — Promote students from one class to next
// Module 2.6: Class Promotion System
export async function POST(request: NextRequest) {
  const { error, ctx } = await requireAuth();
  if (error) return error;

  // Only Administrator+ can run promotions
  if (!requireLevel(ctx, 7)) {
    return NextResponse.json({ success: false, error: 'Administrator role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { fromClassId, toClassId, academicYear, promotionType = 'Promoted', studentIds, promoteAll } = body;

    if (!fromClassId || !toClassId || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'fromClassId, toClassId, academicYear are required' },
        { status: 400 }
      );
    }

    // Get students to promote
    const whereClause: any = { currentClassId: fromClassId, status: 'active' };
    if (!promoteAll && studentIds?.length) {
      whereClause.id = { in: studentIds };
    }

    const students = await db.student.findMany({
      where: whereClause,
      select: { id: true, fullName: true, currentSectionId: true },
    });

    if (!students.length) {
      return NextResponse.json({ success: false, error: 'No eligible students found' }, { status: 400 });
    }

    // Get first section of target class for auto-assignment
    const targetSection = await db.section.findFirst({
      where: { classId: toClassId },
      select: { id: true },
    });

    const results = { promoted: 0, errors: 0, records: [] as any[] };

    for (const student of students) {
      try {
        // Update student class
        await db.student.update({
          where: { id: student.id },
          data: {
            currentClassId:    toClassId,
            currentSectionId:  targetSection?.id || null,
          },
        });

        // Create promotion audit record
        const record = await db.classPromotion.create({
          data: {
            studentId:     student.id,
            fromClassId,
            toClassId,
            fromSectionId: student.currentSectionId || null,
            toSectionId:   targetSection?.id || null,
            promotionType,
            academicYear,
            promotedBy:    ctx.id,
            remarks:       `Promoted via bulk promotion — ${academicYear}`,
          },
        });

        results.promoted++;
        results.records.push({ studentId: student.id, fullName: student.fullName, status: 'promoted' });
      } catch (err) {
        results.errors++;
        results.records.push({ studentId: student.id, fullName: student.fullName, status: 'error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Promoted ${results.promoted} students, ${results.errors} errors`,
      data: results,
    });
  } catch (e: any) {
    console.error('Class promotion error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// GET /api/class-promotion — Get promotion history
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp      = request.nextUrl.searchParams;
    const classId = sp.get('classId') || '';
    const year    = sp.get('academicYear') || '';

    const records = await db.classPromotion.findMany({
      where: {
        ...(classId ? { OR: [{ fromClassId: classId }, { toClassId: classId }] } : {}),
        ...(year ? { academicYear: year } : {}),
      },
      include: {
        student:   { select: { fullName: true, admissionNumber: true } },
        fromClass: { select: { name: true } },
        toClass:   { select: { name: true } },
      },
      orderBy: { promotedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ success: true, data: records });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
