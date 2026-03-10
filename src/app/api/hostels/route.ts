export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const limit = parseInt(sp.get('limit') || '50');
    const blocks = await db.hostelBlock.findMany({
      include: { rooms: { include: { _count: { select: { admissions: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ success: true, data: blocks });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    const block = await db.hostelBlock.create({
      data: {
        name: body.name, type: body.type || 'Mixed',
        capacity: body.capacity ? parseInt(body.capacity) : 0,
        warden: body.warden || null, description: body.description || null,
        schoolId: body.schoolId || schoolId || 'school_default',
      },
    });
    return NextResponse.json({ success: true, data: block }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
