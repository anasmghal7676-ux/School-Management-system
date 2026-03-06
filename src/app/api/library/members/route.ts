export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const status = sp.get('status') || '';
    const type   = sp.get('type')   || '';
    const page   = parseInt(sp.get('page')  || '1');
    const limit  = parseInt(sp.get('limit') || '25');

    const where: any = {};
    if (status) where.status     = status;
    if (type)   where.memberType = type;

    const [members, total] = await Promise.all([
      db.libraryMember.findMany({
        where,
        include: {
          student: {
            select: {
              fullName: true, admissionNumber: true,
              class: { select: { name: true } },
            },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.libraryMember.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { members, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Library members GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberType = 'Student', memberId, issueLimit = 3, validityFrom, validityTo } = body;

    if (!memberId || !validityTo) {
      return NextResponse.json({ success: false, message: 'memberId and validityTo required' }, { status: 400 });
    }

    // Check already registered
    const existing = await db.libraryMember.findFirst({
      where: { memberId, memberType },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Already a library member' }, { status: 409 });
    }

    // Generate card number: LIB-YYYY-NNNN
    const year  = new Date().getFullYear();
    const count = await db.libraryMember.count();
    const cardNumber = `LIB-${year}-${String(count + 1).padStart(4, '0')}`;

    const member = await db.libraryMember.create({
      data: {
        memberType,
        memberId,
        cardNumber,
        issueLimit:   parseInt(String(issueLimit)),
        validityFrom: validityFrom ? new Date(validityFrom) : new Date(),
        validityTo:   new Date(validityTo),
        status:       'Active',
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error('Library members POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to register member' }, { status: 500 });
  }
}
