import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parent = await db.studentParent.findUnique({
      where: { id: params.id },
      include: { student: { select: { fullName: true, admissionNumber: true, class: { select: { name: true } } } } },
    });
    if (!parent) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: parent });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parent = await db.studentParent.update({
      where: { id: params.id },
      data: {
        ...(body.relation         !== undefined && { relation: body.relation }),
        ...(body.firstName        !== undefined && { firstName: body.firstName.trim() }),
        ...(body.lastName         !== undefined && { lastName: body.lastName.trim() }),
        ...(body.phone            !== undefined && { phone: body.phone.trim() }),
        ...(body.alternatePhone   !== undefined && { alternatePhone: body.alternatePhone || null }),
        ...(body.email            !== undefined && { email: body.email || null }),
        ...(body.occupation       !== undefined && { occupation: body.occupation || null }),
        ...(body.annualIncome     !== undefined && { annualIncome: body.annualIncome ? parseFloat(body.annualIncome) : null }),
        ...(body.cnicNumber       !== undefined && { cnicNumber: body.cnicNumber || null }),
        ...(body.isPrimaryContact !== undefined && { isPrimaryContact: body.isPrimaryContact }),
        ...(body.isFeeResponsible !== undefined && { isFeeResponsible: body.isFeeResponsible }),
        ...(body.officeAddress    !== undefined && { officeAddress: body.officeAddress || null }),
      },
    });
    return NextResponse.json({ success: true, data: parent });
  } catch {
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.studentParent.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
