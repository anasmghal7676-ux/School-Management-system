export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const expenses = await db.expenseCategory.findMany({ include: { _count: { select: { expenses: true } } }, orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: expenses });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });
    const item = await db.expenseCategory.create({ data: { name: body.name, description: body.description || null, budgetLimit: body.budgetLimit ? parseFloat(body.budgetLimit) : null } });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
