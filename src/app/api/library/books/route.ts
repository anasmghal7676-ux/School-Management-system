export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/library/books - Get all books
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const books = await db.libraryBook.findMany({
      where,
      orderBy: [
        { title: 'asc' },
        { author: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: books,
      count: books.length,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST /api/library/books - Create new book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      author,
      publisher,
      isbn,
      edition,
      category,
      rackNumber,
      quantity,
      price,
      schoolId,
    } = body;

    // Validation
    if (!title || !author || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, author, quantity' },
        { status: 400 }
      );
    }

    // Generate accession number if not provided
    const accessionNumber = body.accessionNumber || `ACC-${Date.now().toString().slice(-8)}`;

    const newBook = await db.libraryBook.create({
      data: {
        schoolId: schoolId || null,
        accessionNumber,
        title,
        author,
        publisher: publisher || null,
        isbn: isbn || null,
        edition: edition || null,
        category: category || null,
        rackNumber: rackNumber || null,
        quantity: parseInt(quantity),
        availableQuantity: parseInt(quantity),
        price: price ? parseFloat(price) : null,
        status: 'Available',
      },
    });

    return NextResponse.json({
      success: true,
      data: newBook,
      message: 'Book added successfully',
    });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create book' },
      { status: 500 }
    );
  }
}
