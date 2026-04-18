export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const sp = request.nextUrl.searchParams;
    const studentId = sp.get('studentId') || '';
    const type      = sp.get('type')      || '';
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (studentId) where.studentId      = studentId;
    if (type)      where.certificateType = type;
    if (search) {
      where.OR = [
        { certificateNumber: { contains: search } },
        { purpose:           { contains: search } },
      ];
    }

    const [certs, total] = await Promise.all([
      db.certificate.findMany({
        where,
        include: {
          student: {
            select: {
              id: true, fullName: true, admissionNumber: true, rollNumber: true, fatherName: true,
              class: { select: { name: true } }, section: { select: { name: true } },
            },
          },
        },
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { issueDate: 'desc' },
      }),
      db.certificate.count({ where }),
    ]);

    const typeCounts = await db.certificate.groupBy({
      by: ['certificateType'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        certificates: certs,
        pagination:   { page, limit, total, totalPages: Math.ceil(total / limit) },
        typeCounts:   Object.fromEntries(typeCounts.map(t => [t.certificateType, t._count])),
      },
    });
  } catch (error) {
    console.error('Certificates GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { studentId, certificateType, issueDate, purpose, issuedBy, verifiedBy } = body;

    if (!studentId || !certificateType) {
      return NextResponse.json({ success: false, message: 'studentId and certificateType required' }, { status: 400 });
    }

    // Auto-generate certificate number: TYPE-YYYY-NNNN
    const year  = new Date().getFullYear();
    const count = await db.certificate.count({ where: { certificateType } });
    const prefix = { Bonafide: 'BON', 'Transfer Certificate': 'TC', Character: 'CHAR', Migration: 'MIG', Participation: 'PAR', 'Course Completion': 'CC' }[certificateType] || 'CERT';
    const certNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

    const cert = await db.certificate.create({
      data: {
        studentId,
        certificateType,
        issueDate:         issueDate ? new Date(issueDate) : new Date(),
        certificateNumber: certNumber,
        purpose:           purpose    || null,
        issuedBy:          issuedBy   || null,
        verifiedBy:        verifiedBy || null,
      },
      include: {
        student: {
          select: {
            fullName: true, admissionNumber: true, fatherName: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: cert }, { status: 201 });
  } catch (error) {
    console.error('Certificates POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to issue certificate' }, { status: 500 });
  }
}
