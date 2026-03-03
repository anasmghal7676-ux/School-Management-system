import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Core entity counts
    const [
      students, staff, users, classes, sections, subjects,
      feePayments, attendance, marks, leaves,
      auditLogs, systemSettings,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.staff.count(),
      prisma.user.count(),
      prisma.class.count(),
      prisma.section.count(),
      prisma.subject.count(),
      prisma.feePayment.count(),
      prisma.attendance.count(),
      prisma.mark.count(),
      prisma.leaveApplication.count(),
      prisma.auditLog.count(),
      prisma.systemSetting.count(),
    ]);

    // Recent activity
    const recentAudit = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { action: true, entity: true, createdAt: true, userId: true, details: true },
    });

    // Login activity
    const loginAttempts = await prisma.loginAttempt.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { username: true, success: true, ipAddress: true, createdAt: true },
    });

    const todayLogins = await prisma.loginAttempt.count({ where: { createdAt: { gte: today }, success: true } });
    const failedLogins = await prisma.loginAttempt.count({ where: { createdAt: { gte: today }, success: false } });

    // Active students/staff
    const activeStudents = await prisma.student.count({ where: { status: 'Active' } });
    const activeStaff = await prisma.staff.count({ where: { status: 'Active' } });

    // This month data
    const monthlyFees = await prisma.feePayment.count({ where: { createdAt: { gte: thisMonth } } });
    const monthlyAttendance = await prisma.attendance.count({ where: { date: { gte: thisMonth } } });

    // SystemSettings modules
    const moduleSettings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'module_' } },
    });

    // Last backup
    const lastBackup = await prisma.backupLog.findFirst({ orderBy: { createdAt: 'desc' } });

    const dbStats = {
      students, staff, users, classes, sections, subjects,
      feePayments, attendance, marks, leaves,
      auditLogs, systemSettings: systemSettings,
      activeStudents, activeStaff,
      monthlyFees, monthlyAttendance,
    };

    const tableHealth = [
      { table: 'Students', count: students, active: activeStudents, status: students > 0 ? 'ok' : 'empty' },
      { table: 'Staff', count: staff, active: activeStaff, status: staff > 0 ? 'ok' : 'empty' },
      { table: 'Users', count: users, active: users, status: users > 0 ? 'ok' : 'empty' },
      { table: 'Classes', count: classes, active: classes, status: classes > 0 ? 'ok' : 'empty' },
      { table: 'Fee Payments', count: feePayments, active: monthlyFees, status: 'ok' },
      { table: 'Attendance', count: attendance, active: monthlyAttendance, status: 'ok' },
      { table: 'Marks', count: marks, active: marks, status: 'ok' },
      { table: 'Audit Logs', count: auditLogs, active: auditLogs, status: 'ok' },
    ];

    return NextResponse.json({
      dbStats,
      tableHealth,
      recentAudit,
      loginActivity: { today: todayLogins, failed: failedLogins, recent: loginAttempts },
      lastBackup: lastBackup?.createdAt || null,
      timestamp: now.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
