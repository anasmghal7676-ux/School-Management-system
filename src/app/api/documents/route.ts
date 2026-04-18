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
    const docType   = sp.get('documentType') || '';
    const search    = sp.get('search') || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = Math.min(parseInt(sp.get('limit') || '25'), 200);

    const where: any = {};
    if (studentId) where.studentId    = studentId;
    if (docType)   where.documentType = docType;

    const [docs, total] = await Promise.all([
      db.studentDocument.findMany({
        where,
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } } } },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { uploadDate: 'desc' },
      }),
      db.studentDocument.count({ where }),
    ]);

    // Filter by student name search (post-query for joined field)
    const filtered = search
      ? docs.filter(d =>
          d.student?.fullName.toLowerCase().includes(search.toLowerCase()) ||
          d.student?.admissionNumber.includes(search) ||
          d.fileName.toLowerCase().includes(search.toLowerCase())
        )
      : docs;

    // Document type breakdown
    const typeCounts = await db.studentDocument.groupBy({
      by: ['documentType'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        documents: filtered,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        typeCounts: Object.fromEntries(typeCounts.map(t => [t.documentType, t._count])),
      },
    });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { studentId, documentType, fileName, filePath, fileSize, uploadedBy } = body;

    if (!studentId || !documentType || !fileName) {
      return NextResponse.json(
        { success: false, message: 'studentId, documentType, and fileName are required' },
        { status: 400 }
      );
    }

    const doc = await db.studentDocument.create({
      data: {
        studentId,
        documentType,
        fileName:   fileName.trim(),
        filePath:   filePath || `/documents/${studentId}/${fileName}`,
        fileSize:   fileSize ? parseInt(fileSize) : null,
        uploadedBy: uploadedBy || null,
        uploadDate: new Date(),
      },
      include: {
        student: { select: { fullName: true, admissionNumber: true } },
      },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save document record' }, { status: 500 });
  }
}
