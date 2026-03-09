export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get('search') || '';
    const category = sp.get('category') || '';
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '50');
    const where: any = {};
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } },
    ];
    if (category) where.category = category;
    const [books, total] = await Promise.all([
      db.libraryBook.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*limit, take: limit }),
      db.libraryBook.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: books, total });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.author) return NextResponse.json({ success: false, error: 'Title and author required' }, { status: 400 });
    const book = await db.libraryBook.create({
      data: {
        title: body.title, author: body.author,
        isbn: body.isbn || null, category: body.category || null,
        copies: body.copies ? parseInt(body.copies) : 1,
        availableCopies: body.copies ? parseInt(body.copies) : 1,
        publisher: body.publisher || null,
        publishYear: body.publishYear ? parseInt(body.publishYear) : null,
        description: body.description || null,
        location: body.location || null,
      },
    });
    return NextResponse.json({ success: true, data: book }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
