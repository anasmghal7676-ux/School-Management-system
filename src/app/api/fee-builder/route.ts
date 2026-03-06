export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get('academicYearId') || '';
    const classId = searchParams.get('classId') || '';

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (classId) where.classId = classId;

    const structures = await db.feeStructure.findMany({
      where,
      include: {
        class: true,
        feeType: true,
        academicYear: true,
      },
      orderBy: [{ class: { name: 'asc' } }, { feeType: { name: 'asc' } }],
    });

    // Group by class
    const byClass: Record<string, any> = {};
    structures.forEach((s: any) => {
      const key = s.classId;
      if (!byClass[key]) byClass[key] = { class: s.class, structures: [] };
      byClass[key].structures.push(s);
    });

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const feeTypes = await db.feeType.findMany({ orderBy: { name: 'asc' } });
    const academicYears = await db.academicYear.findMany({ orderBy: { startDate: 'desc' } });

    // Summary
    const totalMonthlyRevenue = structures
      .filter((s: any) => s.frequency === 'Monthly')
      .reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalYearlyRevenue = structures.reduce((sum: number, s: any) => {
      const multiplier: Record<string, number> = { Monthly: 12, Quarterly: 4, Yearly: 1, 'One-time': 1, 'Per-Exam': 3 };
      return sum + s.amount * (multiplier[s.frequency] || 1);
    }, 0);

    return NextResponse.json({
      structures,
      byClass: Object.values(byClass),
      classes,
      feeTypes,
      academicYears,
      summary: {
        total: structures.length,
        totalMonthlyRevenue,
        totalYearlyRevenue,
        classCount: Object.keys(byClass).length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { academicYearId, classId, feeTypeId, amount, frequency, dueDateRule, isMandatory, description } = body;

    if (!academicYearId || !classId || !feeTypeId || !amount)
      return NextResponse.json({ error: 'Academic year, class, fee type, and amount are required' }, { status: 400 });

    const structure = await db.feeStructure.create({
      data: {
        academicYearId,
        classId,
        feeTypeId,
        amount: parseFloat(amount),
        frequency: frequency || 'Monthly',
        dueDateRule: dueDateRule || null,
        isMandatory: isMandatory !== false,
        description: description || null,
      },
      include: { class: true, feeType: true, academicYear: true },
    });

    return NextResponse.json({ structure });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Fee structure already exists for this class/type/year' }, { status: 400 });
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { id, amount, frequency, dueDateRule, isMandatory, description } = body;

    const structure = await db.feeStructure.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        frequency: frequency || undefined,
        dueDateRule: dueDateRule ?? undefined,
        isMandatory: isMandatory !== undefined ? isMandatory : undefined,
        description: description ?? undefined,
      },
      include: { class: true, feeType: true, academicYear: true },
    });

    return NextResponse.json({ structure });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.feeStructure.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
