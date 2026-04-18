export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const item = await db.feeStructure.findUnique({ where: { id }, include: { class: true, feeType: true } });
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await db.feeStructure.update({
      where: { id },
      data: {
        classId: body.classId || undefined,
        feeTypeId: body.feeTypeId || undefined,
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        description: body.description ?? undefined,
      },
      include: { class: true, feeType: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  return PUT(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await db.feeStructure.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (e: any) {
    if (e.code === 'P2003') return NextResponse.json({ success: false, error: 'Cannot delete: referenced by payments' }, { status: 400 });
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
