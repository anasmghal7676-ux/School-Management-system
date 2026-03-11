export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SCHOOL_ID = process.env.SCHOOL_ID || 'school_main';

const DEPARTMENTS = [
  'Accounts', 'Library', 'Hostel', 'Transport', 'Sports', 'IT / Lab', 'Administration',
];

export async function GET(request: NextRequest) {
  try {
    const sp       = request.nextUrl.searchParams;
    const search   = sp.get('search') || '';
    const status   = sp.get('status') || '';
    const page     = parseInt(sp.get('page')  || '1');
    const limit    = parseInt(sp.get('limit') || '20');

    const where: any = { schoolId: SCHOOL_ID };
    if (search) {
      where.OR = [
        { fullName:        { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: [{ fullName: 'asc' }],
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.student.count({ where }),
    ]);

    // Load clearance data from system settings
    const clearanceKeys = students.map(s => `clearance_${s.id}`);
    const clearances    = await db.systemSetting.findMany({
      where: { settingKey: { in: clearanceKeys } },
    });
    const clearanceMap = Object.fromEntries(
      clearances.map(c => [c.key.replace('clearance_', ''), JSON.parse(c.settingValue)])
    );

    const studentsWithClearance = students.map(s => ({
      ...s,
      clearance: clearanceMap[s.id] || null,
    }));

    // Filter by clearance status if requested
    const filtered = status
      ? studentsWithClearance.filter(s => {
          if (status === 'cleared')    return s.clearance?.isFullyCleared;
          if (status === 'pending')    return s.clearance && !s.clearance?.isFullyCleared;
          if (status === 'no-request') return !s.clearance;
          return true;
        })
      : studentsWithClearance;

    return NextResponse.json({
      success: true,
      data: {
        students: filtered,
        departments: DEPARTMENTS,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: {
          total,
          cleared:    studentsWithClearance.filter(s => s.clearance?.isFullyCleared).length,
          pending:    studentsWithClearance.filter(s => s.clearance && !s.clearance?.isFullyCleared).length,
          noRequest:  studentsWithClearance.filter(s => !s.clearance).length,
        },
      },
    });
  } catch (error) {
    console.error('Clearance GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch clearances' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, departmentStatuses, remarks, leavingDate, reason } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'studentId required' }, { status: 400 });
    }

    const isFullyCleared = DEPARTMENTS.every(dept =>
      departmentStatuses?.[dept] === 'cleared'
    );

    const clearance = {
      studentId,
      departmentStatuses: departmentStatuses || {},
      remarks:            remarks || '',
      leavingDate:        leavingDate || null,
      reason:             reason || '',
      isFullyCleared,
      initiatedAt:        new Date().toISOString(),
      clearedAt:          isFullyCleared ? new Date().toISOString() : null,
    };

    await db.systemSetting.upsert({
      where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: `clearance_${studentId}` } },
      create: { settingKey: `clearance_${studentId}`, settingValue: JSON.stringify(clearance), schoolId: 'school_main', settingType: 'General', description: 'Student clearance data' },
      update: { settingValue: JSON.stringify(clearance) },
    });

    return NextResponse.json({ success: true, data: clearance });
  } catch (error) {
    console.error('Clearance POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save clearance' }, { status: 500 });
  }
}
