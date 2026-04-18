export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const discount = await db.feeDiscount.update({
      where: { id: (await params).id },
      data: {
        ...(body.discountType !== undefined && { discountType: body.discountType }),
        ...(body.percentage   !== undefined && { percentage:   parseFloat(body.percentage) }),
        ...(body.fixedAmount  !== undefined && { fixedAmount:  body.fixedAmount ? parseFloat(body.fixedAmount) : null }),
        ...(body.validFrom    !== undefined && { validFrom:    new Date(body.validFrom) }),
        ...(body.validTo      !== undefined && { validTo:      body.validTo ? new Date(body.validTo) : null }),
        ...(body.approvedBy   !== undefined && { approvedBy:   body.approvedBy }),
        ...(body.reason       !== undefined && { reason:       body.reason }),
        ...(body.isActive     !== undefined && { isActive:     body.isActive }),
      },
    });
    return NextResponse.json({ success: true, data: discount });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.feeDiscount.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
