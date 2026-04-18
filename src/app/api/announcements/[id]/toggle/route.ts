export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const announcement = await db.announcement.findUnique({ where: { id: (await params).id } });
    if (!announcement) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    
    const updated = await db.announcement.update({
      where: { id: (await params).id },
      data: { isActive: !announcement.isActive },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
