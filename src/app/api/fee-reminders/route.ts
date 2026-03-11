export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const page    = parseInt(searchParams.get('page') || '1');
    const limit   = 20;

    const where: any = { status: 'Pending' };
    if (classId) where.student = { currentClassId: classId };

    // Find students with pending fee assignments (not payments)
    const students = await db.student.findMany({
      where: {
        status: 'active',
        ...(classId ? { currentClassId: classId } : {}),
        feeAssignments: { some: {} },
      },
      include: {
        class:   { select: { id: true, name: true } },
        section: { select: { name: true } },
        feeAssignments: {
          include: { feeStructure: { include: { feeType: { select: { name: true } } } } },
        },
        feePayments: { select: { paidAmount: true, status: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const studentList = students.map((s: any) => {
      const totalCharged = s.feeAssignments.reduce((sum: number, fa: any) => sum + fa.finalAmount, 0);
      const totalPaid    = s.feePayments.filter((p: any) => p.status === 'Success').reduce((sum: number, p: any) => sum + p.paidAmount, 0);
      const outstanding  = Math.max(0, totalCharged - totalPaid);
      return {
        studentId:       s.id,
        studentName:     s.fullName,
        admissionNumber: s.admissionNumber,
        className:       s.class?.name || '',
        section:         s.section?.name || '',
        phone:           s.fatherPhone || s.guardianPhone || '',
        totalPending:    outstanding,
        severity:        outstanding > 50000 ? 'Critical' : outstanding > 20000 ? 'High' : outstanding > 5000 ? 'Medium' : 'Low',
      };
    }).filter((s: any) => s.totalPending > 0);

    studentList.sort((a: any, b: any) => b.totalPending - a.totalPending);

    const classes = await db.class.findMany({ orderBy: { name: 'asc' } });
    const summary = {
      totalStudents: studentList.length,
      totalAmount:   studentList.reduce((s: number, x: any) => s + x.totalPending, 0),
      critical:      studentList.filter((s: any) => s.severity === 'Critical').length,
      high:          studentList.filter((s: any) => s.severity === 'High').length,
    };

    return NextResponse.json({
      students: studentList.slice((page - 1) * limit, page * limit),
      total:    studentList.length,
      summary,
      classes,
    });
  } catch (e: any) {
    console.error('Fee reminders error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { studentIds, message, channel } = await req.json();
    if (!studentIds?.length) return NextResponse.json({ error: 'No students selected' }, { status: 400 });
    const setting = await db.systemSetting.findUnique({ where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: 'fee_reminders_log' } } });
    const log = setting ? JSON.parse(setting.settingValue) : [];
    log.push({ studentIds, message, channel, sentAt: new Date().toISOString() });
    await db.systemSetting.upsert({
      where: { schoolId_settingKey: { schoolId: 'school_main', settingKey: 'fee_reminders_log' } },
      create: { settingKey: 'fee_reminders_log', settingValue: JSON.stringify(log.slice(-100)), schoolId: 'school_main', settingType: 'General' },
      update: { settingValue: JSON.stringify(log.slice(-100)) },
    });
    return NextResponse.json({ success: true, count: studentIds.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
