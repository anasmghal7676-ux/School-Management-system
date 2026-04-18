export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const where: any = {};
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];

    const departments = await db.department.findMany({
      where,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch HOD details for departments that have headOfDepartmentId
    const hodIds = departments.map(d => d.headOfDepartmentId).filter(Boolean) as string[];
    const hods   = hodIds.length > 0
      ? await db.staff.findMany({ where: { id: { in: hodIds } }, select: { id: true, firstName: true, lastName: true, designation: true } })
      : [];
    const hodMap = Object.fromEntries(hods.map(h => [h.id, h]));

    const enriched = departments.map(d => ({
      ...d,
      headOfDepartment: d.headOfDepartmentId ? hodMap[d.headOfDepartmentId] : null,
      staffCount: d.staff.length,
    }));

    return NextResponse.json({ success: true, data: { departments: enriched, total: enriched.length } });
  } catch (error) {
    console.error('Departments GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, code, headOfDepartmentId, description } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, message: 'name and code are required' }, { status: 400 });
    }

    const dept = await db.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        headOfDepartmentId: headOfDepartmentId || null,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, data: dept }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ success: false, message: 'Department code already exists' }, { status: 409 });
    return NextResponse.json({ success: false, message: 'Failed to create department' }, { status: 500 });
  }
}
