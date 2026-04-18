export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const student = await db.student.findUnique({
      where: { id },
      include: { class: true, section: true },
    });
    if (!student) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: any = {};

    const fields = ['firstName', 'middleName', 'lastName', 'gender', 'email',
      'fatherName', 'fatherPhone', 'fatherOccupation', 'motherName', 'motherPhone',
      'guardianName', 'guardianPhone', 'address', 'city',
      'province', 'religion', 'bloodGroup', 'nationality', 'cnicNumber', 'rollNumber',
      'status', 'currentClassId', 'currentSectionId', 'previousSchool', 'category',
      'medicalConditions', 'remarks', 'transportRequired', 'hostelRequired'];

    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field] || null;
    }

    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.admissionDate) updateData.admissionDate = new Date(body.admissionDate);

    if (updateData.firstName || updateData.lastName) {
      const existing = await db.student.findUnique({ where: { id } });
      const fn = updateData.firstName || existing?.firstName || '';
      const mn = updateData.middleName || existing?.middleName || '';
      const ln = updateData.lastName || existing?.lastName || '';
      updateData.fullName = [fn, mn, ln].filter(Boolean).join(' ');
    }

    const student = await db.student.update({
      where: { id },
      data: updateData,
      include: { class: true, section: true },
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    console.error('PATCH /api/students error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await db.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
