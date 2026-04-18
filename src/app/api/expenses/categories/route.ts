export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const schoolId = request.nextUrl.searchParams.get('schoolId');
    const cats = await db.expenseCategory.findMany({
      where: schoolId ? { schoolId } : {},
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: cats });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, budgetAmount, schoolId } = body;
    if (!name || !schoolId) {
      return NextResponse.json({ success: false, message: 'name and schoolId required' }, { status: 400 });
    }
    const cat = await db.expenseCategory.create({
      data: { name, description: description || null, budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null, schoolId },
    });
    return NextResponse.json({ success: true, data: cat }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
