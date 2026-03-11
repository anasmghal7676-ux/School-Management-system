export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sp        = request.nextUrl.searchParams;
    const classId   = sp.get('classId')   || '';
    const sectionId = sp.get('sectionId') || '';
    const search    = sp.get('search')    || '';
    const page      = parseInt(sp.get('page')  || '1');
    const limit     = parseInt(sp.get('limit') || '24');

    const where: any = { status: 'active' };
    if (classId)   where.currentClassId   = classId;
    if (sectionId) where.currentSectionId = sectionId;
    if (search) {
      where.OR = [
        { fullName:        { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search } },
        { rollNumber:      { contains: search } },
        { fatherName:      { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        select: {
          id:              true,
          admissionNumber: true,
          rollNumber:      true,
          fullName:        true,
          dateOfBirth:     true,
          bloodGroup:      true,
          photo:           true,
          fatherName:      true,
          fatherPhone:     true,
          emergencyPhone:  true,
          gender:          true,
          cnicNumber:      true,
          currentClass:    { select: { name: true } },
          currentSection:  { select: { name: true } },
          address:         { select: { city: true, state: true } },
        },
        orderBy: [{ currentClass: { name: 'asc' } }, { rollNumber: 'asc' }],
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.student.count({ where }),
    ]);

    // Get school info from settings
    const settings = await db.systemSetting.findMany({
      where: { settingKey: { in: ['school_name', 'school_phone', 'school_address', 'school_logo', 'school_email'] } },
    });
    const school: Record<string, string> = {};
    settings.forEach(s => { school[s.key] = s.settingValue; });

    return NextResponse.json({
      success: true,
      data: {
        students,
        school,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('ID Cards GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch student data' }, { status: 500 });
  }
}
