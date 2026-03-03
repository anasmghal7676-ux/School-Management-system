import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const search = searchParams.get('search') || '';

    const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });

    const where: any = { status: 'Active' };
    if (classId) where.classId = classId;
    if (search) where.OR = [{ fullName: { contains: search, mode: 'insensitive' } }, { admissionNumber: { contains: search, mode: 'insensitive' } }];

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true, fullName: true, admissionNumber: true, rollNumber: true,
        dateOfBirth: true, gender: true, bloodGroup: true,
        fatherName: true, fatherPhone: true, address: true, photo: true,
        class: { select: { name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { fullName: 'asc' }],
      take: 100,
    });

    // Get school settings
    const settings = await prisma.systemSetting.findMany({ where: { key: { in: ['school_name', 'school_phone', 'school_address', 'school_logo', 'school_motto'] } } });
    const school: Record<string, string> = {};
    settings.forEach((s: any) => { school[s.key] = s.value; });

    return NextResponse.json({ students, classes, school });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
