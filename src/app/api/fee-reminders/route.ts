export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    // Find students with pending fee payments
    const where: any = { status: 'Pending' };

    const pendingFees = await db.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true, fullName: true, admissionNumber: true,
            class: { select: { id: true, name: true } },
            section: { select: { name: true } },
            parents: { select: { fatherName: true, fatherPhone: true, guardianPhone: true }, take: 1 },
          },
        },
        feeType: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      ...(classId ? { where: { ...where, student: { currentClassId: classId } } } : {}),
    });

    // Group by student
    const studentMap: Record<string, any> = {};
    pendingFees.forEach((f: any) => {
      const sid = f.studentId;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          studentName: f.student?.fullName || '',
          admissionNumber: f.student?.admissionNumber || '',
          className: f.student?.class?.name || '',
          section: f.student?.section?.name || '',
          phone: f.student?.parents?.[0]?.fatherPhone || f.student?.parents?.[0]?.guardianPhone || '',
          fees: [],
          totalPending: 0,
          oldestDue: f.dueDate,
        };
      }
      studentMap[sid].fees.push({ id: f.id, feeType: f.feeType?.name || '', amount: Number(f.netAmount || f.amount), dueDate: f.dueDate });
      studentMap[sid].totalPending += Number(f.netAmount || f.amount);
      if (f.dueDate && f.dueDate < studentMap[sid].oldestDue) studentMap[sid].oldestDue = f.dueDate;
    });

    const students = Object.values(studentMap);
    const today = new Date().toISOString().slice(0, 10);

    students.forEach((s: any) => {
      const daysOverdue = s.oldestDue
        ? Math.ceil((new Date(today).getTime() - new Date(s.oldestDue).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      s.daysOverdue = Math.max(0, daysOverdue);
      s.severity = daysOverdue > 60 ? 'Critical' : daysOverdue > 30 ? 'High' : daysOverdue > 0 ? 'Medium' : 'Low';
    });

    students.sort((a: any, b: any) => b.daysOverdue - a.daysOverdue);

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const summary = {
      totalStudents: students.length,
      totalAmount: students.reduce((s: number, x: any) => s + x.totalPending, 0),
      critical: students.filter((s: any) => s.severity === 'Critical').length,
      high: students.filter((s: any) => s.severity === 'High').length,
    };

    return NextResponse.json({
      students: students.slice((page - 1) * limit, page * limit),
      total: students.length,
      summary,
      classes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { studentIds, message, channel } = await req.json();

    // Log reminder as system setting
    const KEY = 'fee_reminder_';
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await db.systemSetting.create({
      data: {
        key: KEY + id,
        value: JSON.stringify({ id, studentIds, message, channel, sentAt: new Date().toISOString(), count: studentIds?.length || 0 }),
      },
    });

    return NextResponse.json({ ok: true, sent: studentIds?.length || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
