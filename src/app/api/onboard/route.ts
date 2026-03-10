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
    const existing = await db.school.findUnique({ where: { id: schoolId } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'A school with this code already exists' }, { status: 409 });
    }

    const existingUser = await db.user.findFirst({ where: { email: admin.email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const nameParts = admin.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    await db.$transaction(async (tx) => {
      await tx.school.create({
        data: {
          id: schoolId,
          name: school.name,
          code: school.code,
          email: school.email,
          phone: school.phone || 'N/A',
          address: school.address || 'N/A',
          city: 'N/A',
          province: 'N/A',
          country: 'Pakistan',
          postalCode: '00000',
          affiliation: 'N/A',
          board: 'N/A',
          establishedDate: new Date(),
          isActive: true,
        },
      });

      const roleId = `role_super_${schoolId}`;
      const existingRole = await tx.role.findUnique({ where: { id: roleId } });
      if (!existingRole) {
        await tx.role.create({
          data: {
            id: roleId,
            name: `Super Admin (${school.code})`,
            description: 'Full system access',
            permissions: ['*'],
            level: 10,
            isSystem: true,
          },
        });
      }

      await tx.user.create({
        data: {
          email: admin.email,
          username: admin.email.split('@')[0],
          passwordHash: hashedPassword,
          firstName,
          lastName,
          roleId,
          isActive: true,
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `School "${school.name}" created. You can now log in.`,
      schoolId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Onboard error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Setup failed' }, { status: 500 });
  }
}
