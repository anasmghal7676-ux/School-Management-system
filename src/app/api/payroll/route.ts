export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, requireAccess } from '@/lib/api-auth';
import { db } from '@/lib/db';

// GET /api/payroll - List payroll records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthYear = searchParams.get('monthYear');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const where: any = {};
    if (monthYear) where.monthYear = monthYear;
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;
    if (departmentId) {
      where.staff = { departmentId };
    }

    const [records, total] = await Promise.all([
      db.payroll.findMany({
        where,
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
              departmentId: true,
              bankAccount: true,
              bankName: true,
              salary: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ monthYear: 'desc' }, { staff: { firstName: 'asc' } }],
      }),
      db.payroll.count({ where }),
    ]);

    // Summary stats
    const summary = await db.payroll.aggregate({
      where,
      _sum: {
        grossSalary: true,
        netSalary: true,
        basicSalary: true,
      },
      _count: true,
    });

    const byStatus = await db.payroll.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { netSalary: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        records: records.map(r => ({
          ...r,
          allowancesData: safeParseJSON(r.allowances, {}),
          deductionsData: safeParseJSON(r.deductions, {}),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalGross: summary._sum.grossSalary || 0,
          totalNet: summary._sum.netSalary || 0,
          totalBasic: summary._sum.basicSalary || 0,
          count: summary._count,
          byStatus,
        },
      },
    });
  } catch (error) {
    console.error('Payroll GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

// POST /api/payroll - Generate payroll for month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthYear, staffIds, generateAll, schoolId } = body;

    if (!monthYear) {
      return NextResponse.json(
        { success: false, message: 'monthYear is required (YYYY-MM)' },
        { status: 400 }
      );
    }

    // P1-4: Enforce YYYY-MM format — reject "January 2025" etc.
    if (!/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json(
        { success: false, message: 'monthYear must be in YYYY-MM format (e.g. 2025-01)' },
        { status: 400 }
      );
    }

    // Get staff to generate payroll for
    const staffQuery: any = {
      status: 'active',
    };
    if (schoolId) staffQuery.schoolId = schoolId;
    if (!generateAll && staffIds?.length) {
      staffQuery.id = { in: staffIds };
    }

    const staffList = await db.staff.findMany({
      where: staffQuery,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        salary: true,
        designation: true,
        employmentType: true,
      },
    });

    if (!staffList.length) {
      return NextResponse.json(
        { success: false, message: 'No active staff found' },
        { status: 400 }
      );
    }

    const results = { created: 0, skipped: 0, errors: 0, records: [] as any[] };

    for (const staff of staffList) {
      try {
        const basicSalary = staff.salary || 0;

        // Default allowances structure
        const allowances = {
          houseRent: Math.round(basicSalary * 0.45),
          medical: Math.round(basicSalary * 0.10),
          transport: Math.round(basicSalary * 0.05),
          other: 0,
        };

        // Default deductions
        const deductions = {
          incomeTax: calculateIncomeTax(basicSalary),
          eobi: Math.round(basicSalary * 0.01), // 1% EOBI
          providentFund: 0,
          other: 0,
        };

        const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
        const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
        const grossSalary = basicSalary + totalAllowances;
        const netSalary = grossSalary - totalDeductions;

        // Upsert: skip if already exists
        const existing = await db.payroll.findUnique({
          where: { staffId_monthYear: { staffId: staff.id, monthYear } },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        const record = await db.payroll.create({
          data: {
            staffId: staff.id,
            monthYear,
            basicSalary,
            allowances: JSON.stringify(allowances),
            deductions: JSON.stringify(deductions),
            grossSalary,
            netSalary,
            status: 'Pending',
          },
        });

        results.created++;
        results.records.push({ ...record, staffName: `${staff.firstName} ${staff.lastName}` });
      } catch (err) {
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Generated ${results.created} payroll records. ${results.skipped} already existed.`,
    });
  } catch (error) {
    console.error('Payroll POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate payroll' },
      { status: 500 }
    );
  }
}

function safeParseJSON(str: string | null, fallback: any) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

function calculateIncomeTax(monthlySalary: number): number {
  const annual = monthlySalary * 12;
  // Pakistan income tax slabs (simplified)
  if (annual <= 600000) return 0;
  if (annual <= 1200000) return Math.round(((annual - 600000) * 0.025) / 12);
  if (annual <= 2400000) return Math.round((15000 + (annual - 1200000) * 0.125) / 12);
  if (annual <= 3600000) return Math.round((165000 + (annual - 2400000) * 0.20) / 12);
  return Math.round((405000 + (annual - 3600000) * 0.25) / 12);
}
