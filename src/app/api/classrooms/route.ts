export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp   = request.nextUrl.searchParams;
    const type = sp.get('type') || '';
    const avail= sp.get('available');

    const where: any = { schoolId: SCHOOL_ID };
    if (type) where.type = type;
    if (avail !== null && avail !== undefined) where.isAvailable = avail === 'true';

    const classrooms = await (db as any).classroom.findMany({
      where,
      orderBy: [{ building: 'asc' }, { name: 'asc' }],
    });

    const summary = {
      total:       classrooms.length,
      available:   classrooms.filter((c: any) => c.isAvailable).length,
      unavailable: classrooms.filter((c: any) => !c.isAvailable).length,
      totalCapacity: classrooms.reduce((s: number, c: any) => s + c.capacity, 0),
    };

    const typeBreakdown = [...new Set(classrooms.map((c: any) => c.type))].map(t => ({
      type: t,
      count: classrooms.filter((c: any) => c.type === t).length,
    }));

    return NextResponse.json({ success: true, data: { classrooms, summary, typeBreakdown } });
  } catch (error) {
    console.error('Classrooms GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch classrooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, message: 'name required' }, { status: 400 });

    const classroom = await (db as any).classroom.create({
      data: {
        schoolId:    SCHOOL_ID,
        name:        body.name,
        building:    body.building    || null,
        floor:       body.floor       || null,
        capacity:    parseInt(body.capacity || '40'),
        type:        body.type        || 'Classroom',
        facilities:  body.facilities  || [],
        isAvailable: body.isAvailable !== false,
        notes:       body.notes       || null,
      },
    });

    return NextResponse.json({ success: true, data: classroom }, { status: 201 });
  } catch (error) {
    console.error('Classrooms POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create classroom' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });

    const data: any = {};
    if (updates.name        !== undefined) data.name        = updates.name;
    if (updates.building    !== undefined) data.building    = updates.building;
    if (updates.floor       !== undefined) data.floor       = updates.floor;
    if (updates.capacity    !== undefined) data.capacity    = parseInt(updates.capacity);
    if (updates.type        !== undefined) data.type        = updates.type;
    if (updates.facilities  !== undefined) data.facilities  = updates.facilities;
    if (updates.isAvailable !== undefined) data.isAvailable = updates.isAvailable;
    if (updates.notes       !== undefined) data.notes       = updates.notes;

    const classroom = await (db as any).classroom.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: classroom });
  } catch (error) {
    console.error('Classrooms PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    await (db as any).classroom.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
