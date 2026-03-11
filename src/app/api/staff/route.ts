export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const search = params.get('search') || '';
    const departmentId = params.get('departmentId') || '';
    const page = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;

    const [staff, total] = await Promise.all([
      db.staff.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { department: true } }),
      db.staff.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: staff, total });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.firstName || !body.lastName || !body.gender || !body.dateOfBirth || !body.email || !body.phone) {
      return NextResponse.json({ success: false, error: 'firstName, lastName, gender, dateOfBirth, email, phone are required' }, { status: 400 });
    }

    const count = await db.staff.count();
    const employeeCode = body.employeeCode || `EMP-${String(count + 1).padStart(4, '0')}`;

    const staff = await db.staff.create({
      data: {
        employeeCode,
        firstName: body.firstName,
        lastName: body.lastName,
        fullName: `${body.firstName} ${body.lastName}`.trim(),
        gender: body.gender,
        dateOfBirth: new Date(body.dateOfBirth),
        phone: body.phone,
        email: body.email,
        designation: body.designation || 'Teacher',
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : new Date(),
        employmentType: body.employmentType || 'Permanent',
        alternatePhone: body.alternatePhone || null,
        qualification: body.qualification || null,
        experienceYears: body.experienceYears ? parseInt(body.experienceYears) : 0,
        salary: body.salary ? parseFloat(body.salary) : null,
        address: body.address || null,
        cnicNumber: body.cnicNumber || null,
        departmentId: body.departmentId || null,
        status: body.status || 'active',
        schoolId: 'school_main',
      },
      include: { department: true },
    });

    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/staff error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
