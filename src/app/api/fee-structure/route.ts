import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const classId = sp.get('classId');
    const academicYearId = sp.get('academicYearId');

    const where: any = {};
    if (classId) where.classId = classId;
    if (academicYearId) where.academicYearId = academicYearId;

    const structures = await db.feeStructure.findMany({
      where,
      include: {
        feeType: true,
        class: { select: { id: true, name: true, code: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { feeType: { name: 'asc' } }],
    });

    const byClassMap: Record<string, any> = {};
    for (const s of structures) {
      const key = s.classId;
      if (!byClassMap[key]) {
        byClassMap[key] = { classId: s.classId, className: s.class?.name || 'Unknown', structures: [], totalMonthly: 0 };
      }
      byClassMap[key].structures.push(s);
      if (s.frequency === 'Monthly') byClassMap[key].totalMonthly += s.amount;
    }

    return NextResponse.json({
      success: true,
      data: { structures, byClass: Object.values(byClassMap), total: structures.length },
    });
  } catch (error) {
    console.error('Fee structure GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch fee structures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, feeTypeId, academicYearId, amount, isMandatory, frequency, description } = body;

    if (!feeTypeId || !amount || !classId || !academicYearId) {
      return NextResponse.json({ success: false, message: 'classId, feeTypeId, academicYearId and amount are required' }, { status: 400 });
    }

    const structure = await db.feeStructure.create({
      data: {
        classId,
        feeTypeId,
        academicYearId,
        amount: parseFloat(amount),
        isMandatory: isMandatory ?? true,
        frequency: frequency || 'Monthly',
        description: description || null,
      },
      include: {
        feeType: true,
        class: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Fee structure already exists for this class and fee type' }, { status: 409 });
    }
    console.error('Fee structure POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create fee structure' }, { status: 500 });
  }
}
