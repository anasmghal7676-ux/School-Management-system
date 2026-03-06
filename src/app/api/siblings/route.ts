export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Find families grouped by father name / family ID
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { fatherName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await db.student.findMany({
      where,
      include: { class: true, section: true },
      orderBy: [{ fatherName: 'asc' }, { fullName: 'asc' }],
    });

    // Group by fatherName + phone as family unit
    const familyMap: Record<string, any> = {};
    students.forEach((s: any) => {
      const key = `${s.fatherName?.toLowerCase().trim()}|${s.phone?.replace(/\D/g, '') || ''}`;
      if (!familyMap[key]) {
        familyMap[key] = {
          fatherName: s.fatherName,
          phone: s.phone,
          address: s.address,
          siblings: [],
          totalFees: 0,
        };
      }
      familyMap[key].siblings.push({
        id: s.id, fullName: s.fullName, admissionNumber: s.admissionNumber,
        class: s.class?.name, section: s.section?.name, status: s.status,
        gender: s.gender, dateOfBirth: s.dateOfBirth,
      });
    });

    // Only families with 2+ children
    const families = Object.values(familyMap).filter((f: any) => f.siblings.length >= 2);
    families.sort((a: any, b: any) => b.siblings.length - a.siblings.length);

    const total = families.length;
    const paginated = families.slice((page - 1) * limit, page * limit);

    const summary = {
      totalFamilies: families.length,
      totalSiblings: families.reduce((s: number, f: any) => s + f.siblings.length, 0),
      maxSiblings: families.length > 0 ? Math.max(...families.map((f: any) => f.siblings.length)) : 0,
    };

    return NextResponse.json({ families: paginated, total, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
