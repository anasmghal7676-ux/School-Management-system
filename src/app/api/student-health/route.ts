export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (type) where.recordType = type;
    if (search) {
      where.OR = [
        { student: { fullName: { contains: search, mode: 'insensitive' } } },
        { student: { admissionNumber: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      db.medicalRecord.findMany({
        where,
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.medicalRecord.count({ where }),
    ]);

    // Summary stats
    const summary = {
      total: await db.medicalRecord.count(),
      thisMonth: await db.medicalRecord.count({ where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      vaccinations: await db.medicalRecord.count({ where: { recordType: 'Vaccination' } }),
      incidents: await db.medicalRecord.count({ where: { recordType: 'Injury / Incident' } }),
    };

    return NextResponse.json({ records, total, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { studentId, recordType, date, description, diagnosis, treatment, doctor, followUpDate, attachmentUrl, notes } = body;

    if (!studentId || !recordType) return NextResponse.json({ error: 'Student and record type required' }, { status: 400 });

    const record = await db.medicalRecord.create({
      data: {
        studentId,
        recordType: recordType || 'General',
        date: date ? new Date(date) : new Date(),
        description: description || '',
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        doctor: doctor || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        attachmentUrl: attachmentUrl || null,
        notes: notes || null,
      },
      include: { student: { select: { id: true, fullName: true, admissionNumber: true } } },
    });

    return NextResponse.json({ record });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id, ...data } = await req.json();
    const record = await db.medicalRecord.update({
      where: { id },
      data: {
        recordType: data.recordType,
        date: data.date ? new Date(data.date) : undefined,
        description: data.description,
        diagnosis: data.diagnosis || null,
        treatment: data.treatment || null,
        doctor: data.doctor || null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
      },
      include: { student: { select: { id: true, fullName: true, admissionNumber: true } } },
    });
    return NextResponse.json({ record });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);
    const { id } = await req.json();
    await db.medicalRecord.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
