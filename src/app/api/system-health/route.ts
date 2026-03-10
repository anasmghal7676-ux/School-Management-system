export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

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
      db.student.count(),
      db.staff.count(),
      db.user.count(),
      db.class.count(),
      db.section.count(),
      db.subject.count(),
      db.feePayment.count(),
      db.attendance.count(),
      db.mark.count(),
      db.leaveApplication.count(),
      db.auditLog.count(),
      db.systemSetting.count(),
    ]);

    // Recent activity
    const recentAudit = await db.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { action: true, entity: true, createdAt: true, userId: true, details: true },
    });

    // Login activity
    const loginAttempts = await db.loginAttempt.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { username: true, success: true, ipAddress: true, createdAt: true },
    });

    const todayLogins = await db.loginAttempt.count({ where: { createdAt: { gte: today }, success: true } });
    const failedLogins = await db.loginAttempt.count({ where: { createdAt: { gte: today }, success: false } });

    // Active students/staff
    const activeStudents = await db.student.count({ where: { status: 'active' } });
    const activeStaff = await db.staff.count({ where: { status: 'active' } });

    // This month data
    const monthlyFees = await db.feePayment.count({ where: { createdAt: { gte: thisMonth } } });
    const monthlyAttendance = await db.attendance.count({ where: { date: { gte: thisMonth } } });

    // SystemSettings modules
    const moduleSettings = await db.systemSetting.findMany({
      where: { key: { startsWith: 'module_' } },
    });

    // Last backup
    const lastBackup = await db.backupLog.findFirst({ orderBy: { createdAt: 'desc' } });

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
