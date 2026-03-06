export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const schoolId = request.nextUrl.searchParams.get('schoolId');
    const scales = await db.gradeScale.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { minPercentage: 'desc' },
    });
    return NextResponse.json({ success: true, data: scales });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch grade scales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, minPercentage, maxPercentage, grade, gradePoint, description, schoolId } = body;
    if (!grade || minPercentage === undefined || maxPercentage === undefined || !schoolId) {
      return NextResponse.json({ success: false, message: 'grade, minPercentage, maxPercentage, schoolId required' }, { status: 400 });
    }
    const scale = await db.gradeScale.create({
      data: { name: name || grade, minPercentage, maxPercentage, grade, gradePoint: gradePoint || 0, description: description || null, schoolId },
    });
    return NextResponse.json({ success: true, data: scale }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create grade scale' }, { status: 500 });
  }
}
