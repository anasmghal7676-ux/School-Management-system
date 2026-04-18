export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const blocks = await db.hostelBlock.findMany({
      include: {
        _count: {
          select: { rooms: true },
        },
      },
    });

    const blocksWithStats = await Promise.all(
      blocks.map(async (block) => {
        const rooms = await db.hostelRoom.findMany({
          where: { blockId: block.id },
        });

        const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
        const occupiedBeds = await db.hostelAdmission.count({
          where: { roomId: { in: rooms.map(r => r.id) }, status: 'Active' },
        });

        return {
          ...block,
          roomCount: block._count.rooms,
          capacity: totalCapacity,
          occupiedRooms: rooms.length,
          totalStudents: occupiedBeds,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: blocksWithStats,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch blocks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { blockName, blockType, totalRooms, wardenId } = body;

    const newBlock = await db.hostelBlock.create({
      data: {
        schoolId: process.env.SCHOOL_ID || 'school_main',
        blockName,
        blockType,
        totalRooms: parseInt(totalRooms),
        wardenId: wardenId || null,
      },
    });

    return NextResponse.json({ success: true, data: newBlock, message: 'Block created' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create block' }, { status: 500 });
  }
}
