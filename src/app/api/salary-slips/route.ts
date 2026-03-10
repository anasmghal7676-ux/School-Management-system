export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const monthYear = searchParams.get('monthYear') || '';
    const staffId = searchParams.get('staffId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (monthYear) where.monthYear = monthYear;
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

    const payrolls = await db.payroll.findMany({
      where,
      include: {
        staff: {
          include: { department: true },
          select: {
            id: true, fullName: true, employeeCode: true, designation: true,
            department: true, email: true, phone: true, bankAccount: true, bankName: true,
          } as any,
        },
      },
      orderBy: [{ monthYear: 'desc' }, { staff: { fullName: 'asc' } }],
    });

    let filtered = payrolls;
    if (search) {
      const s = search.toLowerCase();
      filtered = payrolls.filter((p: any) =>
        p.staff.fullName.toLowerCase().includes(s) ||
        p.staff.employeeCode.toLowerCase().includes(s) ||
        p.staff.designation.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    // Summary stats for current month
    const allCurrentMonth = payrolls.filter((p: any) => !monthYear || p.monthYear === monthYear);
    const summary = {
      total: allCurrentMonth.length,
      paid: allCurrentMonth.filter((p: any) => p.status === 'Paid').length,
      processed: allCurrentMonth.filter((p: any) => p.status === 'Processed').length,
      pending: allCurrentMonth.filter((p: any) => p.status === 'Pending').length,
      totalNetSalary: allCurrentMonth.reduce((s: number, p: any) => s + p.netSalary, 0),
    };

    // Available months
    const months = await db.payroll.findMany({
      select: { monthYear: true },
      distinct: ['monthYear'],
      orderBy: { monthYear: 'desc' },
    });

    // Available staff
    const staffList = await db.staff.findMany({
      where: { status: 'active' },
      select: { id: true, fullName: true, employeeCode: true },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({ payrolls: paginated, total, summary, months: months.map((m: any) => m.monthYear), staff: staffList });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
