export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const expenses = await db.expenseCategory.findMany({ include: { _count: { select: { expenses: true } } }, orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: expenses });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });
    const school = await db.school.findFirst({ select: { id: true } });
    if (!school) return NextResponse.json({ success: false, error: 'School not configured' }, { status: 400 });
    const item = await db.expenseCategory.create({ data: { name: body.name, description: body.description || null, budgetAmount: body.budgetAmount ? parseFloat(body.budgetAmount) : null, schoolId: school.id } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
