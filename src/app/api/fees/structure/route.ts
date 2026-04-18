export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const params = request.nextUrl.searchParams;
    const classId = params.get('classId') || '';
    const where: any = {};
    if (classId) where.classId = classId;

    const structures = await db.feeStructure.findMany({
      where,
      include: { class: true, feeType: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: structures });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.classId || !body.feeTypeId || !body.amount) {
      return NextResponse.json({ success: false, error: 'classId, feeTypeId, amount are required' }, { status: 400 });
    }
    // P1-6: academicYearId is required — auto-resolve from current year if not provided
    let academicYearId = body.academicYearId;
    if (!academicYearId) {
      const currentYear = await db.academicYear.findFirst({
        where: { isCurrent: true },
        select: { id: true },
      });
      if (!currentYear) {
        return NextResponse.json(
          { success: false, error: 'No current academic year set. Please set one in Settings first.' },
          { status: 400 }
        );
      }
      academicYearId = currentYear.id;
    }

    const structure = await db.feeStructure.create({
      data: {
        classId: body.classId,
        feeTypeId: body.feeTypeId,
        amount: parseFloat(body.amount),
        frequency: body.frequency || 'Monthly',
        dueDateRule: body.dueDateRule || body.dueDate || null,
        academicYearId,
        description: body.description || null,
      },
      include: { class: true, feeType: true },
    });
    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
