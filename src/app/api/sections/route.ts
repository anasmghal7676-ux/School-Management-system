export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const classId = params.get('classId') || '';
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '500');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (classId) where.classId = classId;

    const [sections, total] = await Promise.all([
      db.section.findMany({
        where, skip, take: limit, orderBy: { name: 'asc' },
        include: { class: true, _count: { select: { students: true } } },
      }),
      db.section.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: sections, total });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.classId) {
      return NextResponse.json({ success: false, error: 'name and classId are required' }, { status: 400 });
    }

    const section = await db.section.create({
      data: {
        name: body.name,
        code: body.code || body.name.toUpperCase().slice(0, 10),
        classId: body.classId,
        capacity: body.capacity ? parseInt(body.capacity) : 40,
        roomNumber: body.roomNumber || null,
        description: body.description || null,
      },
      include: { class: true },
    });

    return NextResponse.json({ success: true, data: section }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/sections error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
