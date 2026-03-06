export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const school = await db.school.findFirst();
    if (!school) return NextResponse.json({ success: false, error: 'No school found' }, { status: 404 });

    const where: any = { schoolId: school.id };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) where.OR = [
      { itemName: { contains: search, mode: 'insensitive' } },
      { itemCode: { contains: search, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: { category: { select: { name: true } } },
        orderBy: { itemName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.inventoryItem.count({ where }),
    ]);

    const categories = await db.inventoryCategory.findMany({
      where: { schoolId: school.id },
      orderBy: { name: 'asc' },
    });

    const summary = {
      total,
      inStock: items.filter(i => i.status === 'In-stock').length,
      lowStock: items.filter(i => i.status === 'Low-stock').length,
      outOfStock: items.filter(i => i.status === 'Out-of-stock').length,
    };

    return NextResponse.json({ success: true, data: items, categories, summary, total, page, limit });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const school = await db.school.findFirst();
    if (!school) return NextResponse.json({ success: false, error: 'No school found' }, { status: 404 });

    const item = await db.inventoryItem.create({
      data: { ...body, schoolId: school.id },
    });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
