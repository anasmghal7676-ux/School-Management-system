export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext, requireAccess } from '@/lib/api-auth'

// GET /api/payroll/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const record = await db.payroll.findUnique({
      where: { id: (await params).id },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
            bankAccount: true,
            bankName: true,
            salary: true,
            cnicNumber: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, message: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        allowancesData: safeParseJSON(record.allowances, {}),
        deductionsData: safeParseJSON(record.deductions, {}),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch payroll record' }, { status: 500 });
  }
}

// PUT /api/payroll/[id] - Update payroll record
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const {
      basicSalary,
      allowances,
      deductions,
      status,
      paymentDate,
      paymentMode,
      processedBy,
    } = body;

    const existing = await db.payroll.findUnique({ where: { id: (await params).id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }

    // Recalculate totals
    const allowancesObj = typeof allowances === 'object' ? allowances : safeParseJSON(allowances, {});
    const deductionsObj = typeof deductions === 'object' ? deductions : safeParseJSON(deductions, {});
    const totalAllowances = Object.values(allowancesObj as Record<string, number>).reduce((a: number, b) => a + ((Number(b) || 0) || 0), 0);
    const totalDeductions = Object.values(deductionsObj as Record<string, number>).reduce((a: number, b) => a + ((Number(b) || 0) || 0), 0);
    const gross = (basicSalary || existing.basicSalary) + totalAllowances;
    const net = gross - totalDeductions;

    const updated = await db.payroll.update({
      where: { id: (await params).id },
      data: {
        basicSalary: basicSalary ?? existing.basicSalary,
        allowances: JSON.stringify(allowancesObj),
        deductions: JSON.stringify(deductionsObj),
        grossSalary: gross,
        netSalary: net,
        status: status ?? existing.status,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        paymentMode: paymentMode ?? existing.paymentMode,
        processedBy: processedBy ?? existing.processedBy,
      },
      include: {
        staff: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Payroll PUT error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update payroll record' }, { status: 500 });
  }
}

// DELETE /api/payroll/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _auth = getAuthContext(request)
  const _denied = requireAccess(_auth, { minLevel: 6 })
  if (_denied) return _denied

  try {
    const existing = await db.payroll.findUnique({ where: { id: (await params).id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }

    if (existing.status === 'Paid') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete a paid payroll record' },
        { status: 400 }
      );
    }

    await db.payroll.delete({ where: { id: (await params).id } });
    return NextResponse.json({ success: true, message: 'Payroll record deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete payroll record' }, { status: 500 });
  }
}

function safeParseJSON(str: string | null, fallback: any) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}
