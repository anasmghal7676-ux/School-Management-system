export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const alumni = await db.alumni.update({
      where: { id: (await params).id },
      data: {
        ...(body.currentOccupation !== undefined && { currentOccupation: body.currentOccupation }),
        ...(body.currentEmployer   !== undefined && { currentEmployer:   body.currentEmployer }),
        ...(body.currentCity       !== undefined && { currentCity:       body.currentCity }),
        ...(body.contactEmail      !== undefined && { contactEmail:      body.contactEmail }),
        ...(body.contactPhone      !== undefined && { contactPhone:      body.contactPhone }),
        ...(body.willingToMentor   !== undefined && { willingToMentor:   body.willingToMentor }),
        ...(body.notes             !== undefined && { notes:             body.notes }),
      },
    });
    return NextResponse.json({ success: true, data: alumni });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.alumni.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
