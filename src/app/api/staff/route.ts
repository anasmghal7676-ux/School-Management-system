export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StaffSchema } from '@/lib/validations/staff'

// GET /api/staff - Get all staff
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const designation = searchParams.get('designation');
    const departmentId = searchParams.get('departmentId');

    const where: any = {};
    if (status) where.status = status;
    if (designation) where.designation = designation;
    if (departmentId) where.departmentId = departmentId;

    const staffList = await db.staff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { status: 'desc' },
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    const transformedStaff = staffList.map((member) => ({
      id: member.id,
      employeeCode: member.employeeCode,
      firstName: member.firstName,
      lastName: member.lastName,
      fullName: `${member.firstName} ${member.lastName}`,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth.toISOString(),
      phone: member.phone,
      alternatePhone: member.alternatePhone,
      email: member.email,
      designation: member.designation,
      department: member.department?.name || null,
      departmentId: member.departmentId,
      qualification: member.qualification,
      experienceYears: member.experienceYears,
      joiningDate: member.joiningDate.toISOString(),
      salary: member.salary,
      bankAccount: member.bankAccount,
      bankName: member.bankName,
      cnicNumber: member.cnicNumber,
      address: member.address,
      status: member.status,
      employmentType: member.employmentType,
      profilePhoto: member.profilePhoto,
      userId: member.userId,
      hasUserAccount: !!member.user,
      userAccount: member.user || null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedStaff,
      count: transformedStaff.length,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

  const _parsed = StaffSchema.safeParse(body)
  if (!_parsed.success) {
    return NextResponse.json({
      success: false, error: 'Validation failed',
      details: _parsed.error.flatten().fieldErrors,
    }, { status: 400 })
  }
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      alternatePhone,
      email,
      designation,
      departmentId,
      qualification,
      experienceYears,
      joiningDate,
      salary,
      employmentType,
      cnicNumber,
      address,
      bankAccount,
      bankName,
      status,
    } = body;

    // Validation
    if (!firstName || !lastName || !gender || !dateOfBirth || !phone || !email || !designation || !employmentType || !joiningDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.staff.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Generate employee code if not provided
    const employeeCode = body.employeeCode || `STF-${Date.now().toString().slice(-6)}`;

    const newStaff = await db.staff.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        phone,
        alternatePhone: alternatePhone || null,
        email,
        designation,
        departmentId: departmentId || null,
        qualification: qualification || null,
        experienceYears: parseInt(experienceYears) || 0,
        joiningDate: new Date(joiningDate),
        salary: salary ? parseFloat(salary) : null,
        employmentType,
        cnicNumber: cnicNumber || null,
        address: address || null,
        bankAccount: bankAccount || null,
        bankName: bankName || null,
        status: status || 'active',
      },
    });

    return NextResponse.json({
      success: true,
      data: newStaff,
      message: 'Staff created successfully',
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff' },
      { status: 500 }
    );
  }
}
