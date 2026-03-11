export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';
const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function GET(request: NextRequest) {
  try {
    const sp     = request.nextUrl.searchParams;
    const week   = sp.get('week') || new Date().toISOString().slice(0, 10);
    const type   = sp.get('type') || '';      // Gate, Canteen, Library, Exam, Assembly, Other

    // Fetch timetable slots as proxy for duty periods
    const [staff, timetable] = await Promise.all([
      db.staff.findMany({
        where: { schoolId: SCHOOL_ID, status: 'active' },
        select: { id: true, fullName: true, employeeCode: true, designation: true, department: { select: { name: true } } },
        orderBy: { fullName: 'asc' },
      }),
      db.timetableSlot.findMany({
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, periodNumber: true },
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        take: 50,
      }),
    ]);

    // Return roster skeleton: one row per staff, one col per day
    return NextResponse.json({
      success: true,
      data: {
        staff,
        days: DAYS,
        dutyTypes: ['Gate Duty', 'Canteen Duty', 'Library Duty', 'Exam Duty', 'Assembly', 'Morning Assembly', 'Break Duty', 'After School'],
        week,
      },
    });
  } catch (error) {
    console.error('Duty roster GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch duty roster' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Duty roster stored in system settings as JSON
    const { week, assignments } = body;

    await db.systemSetting.upsert({
      where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `duty_roster_${week}` } },
      create: { settingKey: `duty_roster_${week}`, settingValue: JSON.stringify(assignments), schoolId: 'school_main', settingType: 'General', description: `Duty roster for week ${week}` },
      update: { settingValue: JSON.stringify(assignments) },
    });

    return NextResponse.json({ success: true, data: { week, assignments } });
  } catch (error) {
    console.error('Duty roster POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save duty roster' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { week } = body;

    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `duty_roster_${week}` } } });
    if (!setting) {
      return NextResponse.json({ success: true, data: { week, assignments: {} } });
    }

    const assignments = JSON.parse(setting.settingValue || '{}');
    return NextResponse.json({ success: true, data: { week, assignments } });
  } catch (error) {
    console.error('Duty roster PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load roster' }, { status: 500 });
  }
}
