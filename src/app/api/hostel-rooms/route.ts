export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const blocks = await db.hostelBlock.findMany({
      include: {
        rooms: {
          include: { admissions: { where: { status: 'active' }, include: { student: { select: { id: true, fullName: true, admissionNumber: true } } } } },
          orderBy: { roomNumber: 'asc' },
        },
      },
      orderBy: { blockName: 'asc' },
    });

    // Apply filters on rooms
    const filteredBlocks = blocks.map((block: any) => ({
      ...block,
      rooms: block.rooms.filter((room: any) => {
        if (blockId && block.id !== blockId) return false;
        if (status && room.status !== status) return false;
        if (type && room.roomType !== type) return false;
        return true;
      }),
    }));

    const allRooms = blocks.flatMap((b: any) => b.rooms);
    const summary = {
      totalBlocks: blocks.length,
      totalRooms: allRooms.length,
      occupied: allRooms.filter((r: any) => r.status === 'Occupied').length,
      available: allRooms.filter((r: any) => r.status === 'Available').length,
      maintenance: allRooms.filter((r: any) => r.status === 'Maintenance').length,
      totalCapacity: allRooms.reduce((s: number, r: any) => s + r.capacity, 0),
      occupancy: allRooms.reduce((s: number, r: any) => s + r.admissions.length, 0),
    };

    // Get school for wardens
    const staff = await db.staff.findMany({
      where: { status: 'active' },
      select: { id: true, fullName: true, designation: true },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ blocks: filteredBlocks, summary, staff });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { entity } = body;

    if (entity === 'block') {
      const schoolSetting = await db.systemSetting.findFirst({ where: { key: 'school_info' } });
      const schoolId = schoolSetting ? JSON.parse(schoolSetting.value).id : null;
      // Find first school
      const school = await db.school.findFirst();
      if (!school) return NextResponse.json({ error: 'No school found' }, { status: 400 });

      const block = await db.hostelBlock.create({
        data: {
          schoolId: school.id,
          blockName: body.blockName,
          blockType: body.blockType || 'Boys',
          totalRooms: parseInt(body.totalRooms) || 0,
          wardenId: body.wardenId || null,
          description: body.description || null,
        },
      });
      return NextResponse.json({ block });
    }

    if (entity === 'room') {
      const room = await db.hostelRoom.create({
        data: {
          blockId: body.blockId,
          roomNumber: body.roomNumber,
          roomType: body.roomType || 'Single',
          capacity: parseInt(body.capacity) || 1,
          floorNumber: parseInt(body.floorNumber) || 1,
          monthlyFee: body.monthlyFee ? parseFloat(body.monthlyFee) : null,
          status: body.status || 'Available',
          description: body.description || null,
        },
      });
      return NextResponse.json({ room });
    }

    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { entity, id } = body;

    if (entity === 'block') {
      const block = await db.hostelBlock.update({
        where: { id },
        data: {
          blockName: body.blockName,
          blockType: body.blockType,
          totalRooms: parseInt(body.totalRooms) || 0,
          wardenId: body.wardenId || null,
          description: body.description || null,
        },
      });
      return NextResponse.json({ block });
    }

    if (entity === 'room') {
      const room = await db.hostelRoom.update({
        where: { id },
        data: {
          roomNumber: body.roomNumber,
          roomType: body.roomType,
          capacity: parseInt(body.capacity) || 1,
          floorNumber: parseInt(body.floorNumber) || 1,
          monthlyFee: body.monthlyFee ? parseFloat(body.monthlyFee) : null,
          status: body.status,
          description: body.description || null,
        },
      });
      return NextResponse.json({ room });
    }

    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { entity, id } = await req.json();
    if (entity === 'block') {
      await db.hostelBlock.delete({ where: { id } });
    } else {
      await db.hostelRoom.delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
