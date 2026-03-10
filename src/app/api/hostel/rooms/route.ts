export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;

    const rooms = await db.hostelRoom.findMany({
      where,
      include: {
        block: { select: { name: true } },
        admissions: {
          where: { status: 'active' },
          include: { student: { select: { fullName: true, admissionNumber: true } } }
        }
      },
      orderBy: [{ blockId: 'asc' }, { roomNumber: 'asc' }]
    });

    const summary = {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'Available').length,
      occupied: rooms.filter(r => r.status === 'Occupied').length,
      maintenance: rooms.filter(r => r.status === 'Maintenance').length,
    };

    return NextResponse.json({ success: true, data: rooms, summary });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const room = await db.hostelRoom.create({ data: body });
    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
