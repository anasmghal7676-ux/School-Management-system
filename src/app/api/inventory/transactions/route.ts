export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp     = request.nextUrl.searchParams;
    const itemId = sp.get('itemId') || '';
    const type   = sp.get('type')   || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (itemId) where.itemId = itemId;
    if (type)   where.transactionType = type;

    const [transactions, total] = await Promise.all([
      db.inventoryTransaction.findMany({
        where,
        include: { item: { select: { itemName: true, unit: true, category: { select: { name: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { transactionDate: 'desc' },
      }),
      db.inventoryTransaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { itemId, transactionType, quantity, issuedToType, issuedToId, remarks, performedBy } = body;

    if (!itemId || !transactionType || !quantity) {
      return NextResponse.json({ success: false, message: 'itemId, transactionType, quantity required' }, { status: 400 });
    }

    const qty  = parseInt(quantity);
    const item = await db.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });

    // Calculate new quantity
    let qtyChange = 0;
    if (transactionType === 'Purchase' || transactionType === 'Return') qtyChange = qty;
    if (transactionType === 'Issue'    || transactionType === 'Damage')  qtyChange = -qty;

    const newQty = item.currentStock + qtyChange;
    if (newQty < 0) {
      return NextResponse.json({ success: false, message: `Insufficient stock. Available: ${item.currentStock}` }, { status: 409 });
    }

    const [tx] = await db.$transaction([
      db.inventoryTransaction.create({
        data: {
          itemId,
          transactionType,
          quantity: qty,
          issuedToType: issuedToType || null,
          issuedToId:   issuedToId   || null,
          remarks:      remarks      || null,
          performedBy:  performedBy  || null,
        },
        include: { item: { select: { itemName: true, unit: true } } },
      }),
      db.inventoryItem.update({
        where: { id: itemId },
        data:  { currentStock: newQty },
      }),
    ]);

    return NextResponse.json({ success: true, data: tx }, { status: 201 });
  } catch (error) {
    console.error('Inventory TX POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to record transaction' }, { status: 500 });
  }
}
