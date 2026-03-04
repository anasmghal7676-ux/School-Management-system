import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { name, code, headOfDepartmentId, description } = body;

    const dept = await db.department.update({
      where: { id: (await params).id },
      data: {
        ...(name               !== undefined && { name: name.trim() }),
        ...(code               !== undefined && { code: code.trim().toUpperCase() }),
        ...(headOfDepartmentId !== undefined && { headOfDepartmentId: headOfDepartmentId || null }),
        ...(description        !== undefined && { description }),
      },
    });
    return NextResponse.json({ success: true, data: dept });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ success: false, message: 'Code already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.department.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed — department may have staff assigned' }, { status: 400 });
  }
}
