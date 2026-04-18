export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const cert = await db.certificate.findUnique({
      where: { id: (await params).id },
      include: {
        student: {
          select: {
            fullName: true, admissionNumber: true, rollNumber: true, fatherName: true,
            motherName: true, dateOfBirth: true, gender: true, address: true,
            class: { select: { name: true } }, section: { select: { name: true } },
          },
        },
      },
    });
    if (!cert) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: cert });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await db.certificate.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Certificate deleted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
