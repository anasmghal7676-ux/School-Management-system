export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const sub  = await (db as any).substitution.update({
      where: { id: (await params).id },
      data:  { status: body.status, notes: body.notes },
      include: {
        absentTeacher: { select: { fullName: true } },
        substitute:    { select: { fullName: true } },
        class:         { select: { name: true } },
      },
    });
    return NextResponse.json({ success: true, data: sub });
  } catch (error) {
    console.error('Substitutions PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update substitution' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await (db as any).substitution.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Substitutions DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete substitution' }, { status: 500 });
  }
}
