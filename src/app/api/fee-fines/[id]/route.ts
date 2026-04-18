export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const fine = await db.feeFine.update({
      where: { id: (await params).id },
      data: {
        ...(body.waived    !== undefined && { waived:    body.waived }),
        ...(body.waivedBy  !== undefined && { waivedBy:  body.waivedBy }),
        ...(body.waivedAt  !== undefined && { waivedAt:  body.waivedAt ? new Date(body.waivedAt) : null }),
        ...(body.reason    !== undefined && { reason:    body.reason }),
        ...(body.fineAmount!== undefined && { fineAmount: parseFloat(body.fineAmount) }),
      },
    });
    return NextResponse.json({ success: true, data: fine });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.feeFine.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
