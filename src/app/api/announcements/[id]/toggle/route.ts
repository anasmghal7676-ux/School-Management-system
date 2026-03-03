import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const announcement = await db.announcement.findUnique({ where: { id: params.id } });
    if (!announcement) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    
    const updated = await db.announcement.update({
      where: { id: params.id },
      data: { isActive: !announcement.isActive },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
