export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireLevel, ROLE_LEVELS } from '@/lib/api-auth';
import { requireAuth } from '@/lib/api-auth';

// Root settings - returns school + academic + fee settings combined
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const school = await db.school.findFirst();
    const academicYear = await db.academicYear.findFirst({
      where: { isActive: true },
    });

    const settings = {
      school: school || {},
      academicYear: academicYear || {},
      // Fee settings
      feeGraceDays: 10,
      lateFinePerDay: 50,
      currency: 'PKR',
      // General
      sessionStart: school?.academicYearStart || 'April',
    };

    return NextResponse.json({ success: true, data: settings });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
