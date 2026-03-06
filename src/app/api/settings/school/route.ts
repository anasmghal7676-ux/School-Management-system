export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/settings/school - Save school settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get or create school
    let school = await db.school.findFirst({
      where: { code: body.code },
    });

    if (school) {
      school = await db.school.update({
        where: { id: school.id },
        data: {
          name: body.name,
          code: body.code,
          address: body.address,
          city: body.city,
          province: body.province,
          postalCode: body.postalCode,
          phone: body.phone,
          email: body.email,
          website: body.website || null,
          principalName: body.principalName || null,
          motto: body.motto || null,
          affiliation: body.affiliation,
          board: body.board,
          academicYearStart: body.academicYearStart,
          schoolType: body.schoolType,
          mediumOfInstruction: body.mediumOfInstruction,
        },
      });
    } else {
      school = await db.school.create({
        data: {
          name: body.name,
          code: body.code,
          address: body.address,
          city: body.city,
          province: body.province,
          postalCode: body.postalCode,
          phone: body.phone,
          email: body.email,
          website: body.website || null,
          principalName: body.principalName || null,
          motto: body.motto || null,
          affiliation: body.affiliation,
          board: body.board,
          academicYearStart: body.academicYearStart,
          schoolType: body.schoolType,
          mediumOfInstruction: body.mediumOfInstruction,
          establishedDate: new Date(),
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: school,
      message: 'School settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving school settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save school settings' },
      { status: 500 }
    );
  }
}

// GET /api/settings/school - Get school settings
export async function GET() {
  try {
    const school = await db.school.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error('Error fetching school settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school settings' },
      { status: 500 }
    );
  }
}
