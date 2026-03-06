export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp      = request.nextUrl.searchParams;
    const schoolId  = sp.get('schoolId');
    const catId     = sp.get('categoryId');
    const fromDate  = sp.get('fromDate');
    const toDate    = sp.get('toDate');
    const payMode   = sp.get('paymentMode');
    const search    = sp.get('search') || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (catId)    where.expenseCategoryId = catId;
    if (payMode)  where.paymentMode = payMode;
    if (fromDate && toDate) {
      where.expenseDate = { gte: new Date(fromDate), lte: new Date(new Date(toDate).setHours(23, 59, 59)) };
    } else if (fromDate) {
      where.expenseDate = { gte: new Date(fromDate) };
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { vendorName:  { contains: search } },
        { billNumber:  { contains: search } },
      ];
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: { expenseCategory: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
      db.expense.count({ where }),
    ]);

    const summary = await db.expense.aggregate({
      where,
      _sum:   { amount: true },
      _count: true,
    });

    const byCategory = await db.expense.groupBy({
      by:     ['expenseCategoryId'],
      where,
      _sum:   { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Enrich byCategory with names
    const catMap: Record<string, string> = {};
    (await db.expenseCategory.findMany({ select: { id: true, name: true } })).forEach(c => { catMap[c.id] = c.name; });
    const byCategoryEnriched = byCategory.map(b => ({
      categoryId:   b.expenseCategoryId,
      categoryName: catMap[b.expenseCategoryId] || 'Unknown',
      total:        b._sum.amount || 0,
      count:        b._count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        expenses,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { total: summary._sum.amount || 0, count: summary._count, byCategory: byCategoryEnriched },
      },
    });
  } catch (error) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolId, expenseCategoryId, amount, expenseDate,
      paymentMode, description, billNumber, vendorName, approvedBy,
    } = body;

    if (!expenseCategoryId || !amount || !expenseDate) {
      return NextResponse.json(
        { success: false, message: 'expenseCategoryId, amount and expenseDate are required' },
        { status: 400 }
      );
    }

    const expense = await db.expense.create({
      data: {
        schoolId:          schoolId || null,
        expenseCategoryId,
        amount:            parseFloat(amount),
        expenseDate:       new Date(expenseDate),
        paymentMode:       paymentMode  || null,
        description:       description  || null,
        billNumber:        billNumber   || null,
        vendorName:        vendorName   || null,
        approvedBy:        approvedBy   || null,
      },
      include: { expenseCategory: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    console.error('Expenses POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create expense' }, { status: 500 });
  }
}
