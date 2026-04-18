export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp        = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (search) {
      where.OR = [
        { firstName:   { contains: search, mode: 'insensitive' } },
        { lastName:    { contains: search, mode: 'insensitive' } },
        { phone:       { contains: search } },
        { cnicNumber:  { contains: search } },
      ];
    }

    const [parents, total] = await Promise.all([
      db.studentParent.findMany({
        where,
        include: {
          student: {
            select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } },
          },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.studentParent.count({ where }),
    ]);

    const relationCounts = await db.studentParent.groupBy({ by: ['relation'], _count: true });

    return NextResponse.json({
      success: true,
      data: {
        parents,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        relationCounts: Object.fromEntries(relationCounts.map(r => [r.relation, r._count])),
      },
    });
  } catch (error) {
    console.error('Parents GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch parents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      studentId, relation, firstName, lastName, phone,
      alternatePhone, email, occupation, annualIncome,
      cnicNumber, isPrimaryContact, isFeeResponsible, officeAddress,
    } = body;

    if (!studentId || !relation || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, message: 'studentId, relation, firstName, lastName, and phone are required' },
        { status: 400 }
      );
    }

    const parent = await db.studentParent.create({
      data: {
        studentId,
        relation,
        firstName:        firstName.trim(),
        lastName:         lastName.trim(),
        phone:            phone.trim(),
        alternatePhone:   alternatePhone  || null,
        email:            email           || null,
        occupation:       occupation      || null,
        annualIncome:     annualIncome    ? parseFloat(annualIncome) : null,
        cnicNumber:       cnicNumber      || null,
        isPrimaryContact: isPrimaryContact ?? false,
        isFeeResponsible: isFeeResponsible ?? false,
        officeAddress:    officeAddress   || null,
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: parent }, { status: 201 });
  } catch (error) {
    console.error('Parents POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create parent record' }, { status: 500 });
  }
}
