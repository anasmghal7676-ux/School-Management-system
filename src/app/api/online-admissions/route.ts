export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    // Online admissions are stored in a separate pending pool via AdmissionApplication or as students with pending-like status
    const students = await db.student.findMany({
      where: { status: 'pending' },
      include: { class: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: students });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });
    }

    const school = await db.school.findFirst();
    const schoolId = school?.id || 'school_main';

    const year = new Date().getFullYear();
    const count = await db.student.count();
    const admissionNumber = `${year}-ONLINE-${String(count + 1).padStart(4, '0')}`;

    // Get a default class if not provided
    let classId = body.currentClassId;
    if (!classId) {
      const firstClass = await db.class.findFirst({ where: { schoolId }, orderBy: { name: 'asc' } });
      classId = firstClass?.id;
    }
    if (!classId) return NextResponse.json({ success: false, error: 'No class available' }, { status: 400 });

    const student = await db.student.create({
      data: {
        schoolId,
        admissionNumber,
        rollNumber:     admissionNumber,
        firstName:      body.firstName,
        lastName:       body.lastName,
        fullName:       `${body.firstName} ${body.lastName}`,
        gender:         body.gender      || 'Male',
        dateOfBirth:    body.dateOfBirth ? new Date(body.dateOfBirth) : new Date('2010-01-01'),
        category:       body.category    || 'General',
        currentClassId: classId,
        admissionDate:  new Date(),
        status:         'pending',
        fatherName:     body.fatherName  || 'N/A',
        fatherPhone:    body.fatherPhone || body.phone || '0000000000',
        phone:          body.phone       || null,
        email:          body.email       || null,
      },
    });
    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
