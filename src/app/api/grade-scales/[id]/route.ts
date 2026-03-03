import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const scale = await db.gradeScale.update({
      where: { id: params.id },
      data: {
        ...(body.name           !== undefined && { name: body.name }),
        ...(body.grade          !== undefined && { grade: body.grade }),
        ...(body.minPercentage  !== undefined && { minPercentage: parseFloat(body.minPercentage) }),
        ...(body.maxPercentage  !== undefined && { maxPercentage: parseFloat(body.maxPercentage) }),
        ...(body.gradePoint     !== undefined && { gradePoint: parseFloat(body.gradePoint) }),
        ...(body.description    !== undefined && { description: body.description }),
      },
    });
    return NextResponse.json({ success: true, data: scale });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.gradeScale.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
