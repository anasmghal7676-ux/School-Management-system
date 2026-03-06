export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET — check if setup is needed
export async function GET() {
  try {
    const schoolCount = await db.school.count();
    const userCount = await db.user.count();
    return NextResponse.json({
      setupRequired: schoolCount === 0 || userCount === 0,
      hasSchool: schoolCount > 0,
      hasUsers: userCount > 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — run the setup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      schoolName, schoolCode, address, city, province,
      phone, email, website, board, establishedYear,
      adminName, adminEmail, adminUsername, adminPassword,
      academicYearStart, currentYear, classes, sectionsPerClass,
    } = body;

    // Validate
    if (!schoolName?.trim()) return NextResponse.json({ error: "School name required" }, { status: 400 });
    if (!adminPassword || adminPassword.length < 8) return NextResponse.json({ error: "Password must be 8+ characters" }, { status: 400 });

    // Check not already set up
    const existingSchool = await db.school.count();
    if (existingSchool > 0) {
      return NextResponse.json({ error: "Setup already completed" }, { status: 400 });
    }

    const schoolId = `school_${Date.now()}`;
    const estYear = parseInt(establishedYear) || new Date().getFullYear();

    // 1. Create school
    const school = await db.school.create({
      data: {
        id: schoolId,
        name: schoolName.trim(),
        code: (schoolCode?.trim() || schoolName.slice(0, 6).toUpperCase().replace(/\s/g, '')),
        address: address?.trim() || "N/A",
        city: city?.trim() || "N/A",
        province: province?.trim() || "Punjab",
        postalCode: "00000",
        phone: phone.trim(),
        email: email.trim(),
        website: website?.trim() || null,
        affiliation: board || "Other",
        board: board || "Other",
        establishedDate: new Date(`${estYear}-01-01`),
        academicYearStart: parseInt(academicYearStart) || 4,
      },
    });

    // 2. Create academic year
    const yearLabel = currentYear?.trim() || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const startMonth = parseInt(academicYearStart) || 4;
    const startYear = new Date().getFullYear();
    const endYear = startMonth <= 6 ? startYear : startYear + 1;

    const academicYear = await db.academicYear.create({
      data: {
        schoolId,
        name: yearLabel,
        startDate: new Date(`${startYear}-${String(startMonth).padStart(2, '0')}-01`),
        endDate: new Date(`${endYear}-${String(((startMonth + 10) % 12) || 12).padStart(2, '0')}-30`),
        isCurrent: true,
      },
    });

    // 3. Create classes + sections
    const SECTION_NAMES = ['A', 'B', 'C', 'D', 'E'];
    const numSections = parseInt(sectionsPerClass) || 2;
    const classNames: string[] = classes || ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    const getLevel = (cls: string) => {
      if (['Nursery', 'KG', 'Play Group', 'Prep'].includes(cls)) return 'Pre-Primary';
      const n = parseInt(cls);
      if (n <= 5) return 'Primary';
      if (n <= 8) return 'Middle';
      return 'Matric';
    };

    const getNumeric = (cls: string, idx: number) => {
      if (cls === 'Nursery') return 0;
      if (cls === 'KG') return 0;
      const n = parseInt(cls);
      return isNaN(n) ? idx : n;
    };

    for (let i = 0; i < classNames.length; i++) {
      const cls = classNames[i];
      const classRecord = await db.class.create({
        data: {
          schoolId,
          name: cls,
          code: cls.replace(/\s+/g, '').toUpperCase().slice(0, 8),
          level: getLevel(cls),
          numericValue: getNumeric(cls, i),
          capacity: 40,
        },
      });

      for (let s = 0; s < numSections; s++) {
        await db.section.create({
          data: {
            classId: classRecord.id,
            name: SECTION_NAMES[s],
            code: `${cls}-${SECTION_NAMES[s]}`,
            capacity: 40,
          },
        });
      }
    }

    // 4. Create super admin role (if not exists) and admin user
    let role = await db.role.findFirst({ where: { name: 'super_admin' } });
    if (!role) {
      role = await db.role.create({
        data: {
          id: 'role_superadmin',
          name: 'super_admin',
          displayName: 'Super Admin',
          level: 10,
          permissions: ['*'],
          isSystem: true,
        },
      });
    }

    const [firstName, ...rest] = (adminName?.trim() || 'Admin').split(' ');
    const lastName = rest.join(' ') || 'User';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const username = adminUsername?.trim() || 'admin';

    // Update existing admin user or create new
    const existingAdmin = await db.user.findFirst({ where: { username } });
    if (existingAdmin) {
      await db.user.update({
        where: { id: existingAdmin.id },
        data: {
          firstName,
          lastName,
          email: adminEmail?.trim() || email?.trim(),
          passwordHash,
          roleId: role.id,
          isActive: true,
          schoolId,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    } else {
      await db.user.create({
        data: {
          username,
          email: adminEmail?.trim() || email?.trim(),
          passwordHash,
          firstName,
          lastName,
          roleId: role.id,
          isActive: true,
          schoolId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "School setup complete",
      school: { id: schoolId, name: school.name },
      credentials: { username, password: adminPassword },
    });
  } catch (err: any) {
    console.error("[Setup] Error:", err);
    return NextResponse.json({ error: err.message || "Setup failed" }, { status: 500 });
  }
}
