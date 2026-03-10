export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { school, admin } = await req.json();
    
    if (!school?.name || !school?.code || !school?.email) {
      return NextResponse.json({ success: false, message: 'School name, code, and email are required' }, { status: 400 });
    }
    if (!admin?.name || !admin?.email || !admin?.password || admin.password.length < 8) {
      return NextResponse.json({ success: false, message: 'Admin name, email, and password (min 8 chars) are required' }, { status: 400 });
    }

    const schoolId = `school_${school.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Check if school already exists
    const existing = await db.school.findUnique({ where: { id: schoolId } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'A school with this code already exists' }, { status: 409 });
    }

    // Check if admin email already exists
    const existingUser = await db.user.findFirst({ where: { email: admin.email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12);

    // Create school + admin in a transaction
    await db.$transaction(async (tx) => {
      // Create school
      await tx.school.create({
        data: {
          id: schoolId,
          name: school.name,
          email: school.email,
          phone: school.phone || null,
          address: school.address || null,
          isActive: true,
        },
      });

      // Create admin user
      await tx.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          username: admin.email.split('@')[0],
          passwordHash: hashedPassword,
          role: 'super_admin',
          schoolId,
          isActive: true,
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `School "${school.name}" created successfully. You can now log in.`,
      schoolId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Onboard error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Setup failed' }, { status: 500 });
  }
}
