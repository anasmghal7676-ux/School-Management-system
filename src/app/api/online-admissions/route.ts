export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try {
    const students = await db.student.findMany({ where: { status: 'pending' }, include: { class: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, data: students });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.firstName || !body.lastName) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });
    const year = new Date().getFullYear();
    const count = await db.student.count();
    const admissionNumber = `${year}-ONLINE-${String(count+1).padStart(4,'0')}`;
    const student = await db.student.create({ data: { admissionNumber, firstName: body.firstName, lastName: body.lastName, fullName: `${body.firstName} ${body.lastName}`, gender: body.gender || 'Male', dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : new Date('2010-01-01'), status: 'pending', currentClassId: body.currentClassId || null, phone: body.phone || null, email: body.email || null, fatherName: body.fatherName || null } });
    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
