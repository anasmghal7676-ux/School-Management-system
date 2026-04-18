export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';


export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const params = request.nextUrl.searchParams;
    const search = params.get('search') || '';
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '100');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [classes, total] = await Promise.all([
      db.class.findMany({
        where, skip, take: limit, orderBy: { numericValue: 'asc' },
        include: { sections: true, _count: { select: { students: true } } },
      }),
      db.class.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: classes, total });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });

    const newClass = await db.class.create({
      data: {
        name: body.name,
        code: body.code || body.name.replace(/\s+/g, '').toUpperCase().slice(0, 10),
        level: body.level || 'Primary',
        numericValue: body.numericValue ? parseInt(body.numericValue) : 1,
        capacity: body.capacity ? parseInt(body.capacity) : 40,
        description: body.description || null,
        schoolId: process.env.SCHOOL_ID || 'school_main',
      },
    });

    return NextResponse.json({ success: true, data: newClass }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/classes error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
