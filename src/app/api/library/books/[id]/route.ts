export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/library/books/:id - Get single book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const book = await db.libraryBook.findUnique({
      where: { id: (await params).id },
      include: {
        transactions: {
          where: {
            status: 'Issued',
          },
          include: {
            member: {
              select: {
                id: true,
                cardNumber: true,
                memberType: true,
                memberId: true,
              },
            },
            student: {
              select: {
                id: true,
                admissionNumber: true,
                firstName: true,
                lastName: true,
                rollNumber: true,
              },
            },
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}

// PUT /api/library/books/:id - Update book
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      status,
    } = body;

    // Check if book exists
    const existingBook = await db.libraryBook.findUnique({
      where: { id: (await params).id },
    });

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Calculate new available quantity if quantity changed
    let availableQuantity = existingBook.availableQuantity;
    if (quantity && quantity !== existingBook.quantity) {
      const diff = parseInt(quantity) - existingBook.quantity;
      availableQuantity = Math.max(0, existingBook.availableQuantity + diff);
    }

    const updatedBook = await db.libraryBook.update({
      where: { id: (await params).id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(publisher !== undefined && { publisher: publisher || null }),
        ...(isbn !== undefined && { isbn: isbn || null }),
        ...(edition !== undefined && { edition: edition || null }),
        ...(category !== undefined && { category: category || null }),
        ...(rackNumber !== undefined && { rackNumber: rackNumber || null }),
        ...(quantity && { quantity: parseInt(quantity), availableQuantity }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully',
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE /api/library/books/:id - Delete book
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if book exists
    const existingBook = await db.libraryBook.findUnique({
      where: { id: (await params).id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if book has active transactions
    if (existingBook._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete book with active transactions',
        },
        { status: 400 }
      );
    }

    await db.libraryBook.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
