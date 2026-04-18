export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const assignments = await db.studentFeeAssignment.findMany({
      include: { student: { include: { class: true } }, feeStructure: { include: { feeType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: assignments });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { classId, feeStructureId } = body;
    if (!classId || !feeStructureId) {
      return NextResponse.json({ success: false, error: 'classId and feeStructureId required' }, { status: 400 });
    }
    const feeStructure = await db.feeStructure.findUnique({ where: { id: feeStructureId } });
    if (!feeStructure) return NextResponse.json({ success: false, error: 'Fee structure not found' }, { status: 404 });
    const students = await db.student.findMany({ where: { currentClassId: classId, status: 'active' }, select: { id: true } });
    let created = 0;
    for (const student of students) {
      await db.studentFeeAssignment.upsert({
        where: { studentId_feeStructureId: { studentId: student.id, feeStructureId } },
        update: {},
        create: {
          studentId:         student.id,
          feeStructureId,
          finalAmount:       feeStructure.amount,
          discountAmount:    0,
          discountPercentage: 0,
        },
      });
      created++;
    }
    return NextResponse.json({ success: true, message: `${created} students assigned fee`, created });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
