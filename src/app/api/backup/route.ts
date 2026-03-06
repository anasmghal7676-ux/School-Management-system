export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const page  = parseInt(request.nextUrl.searchParams.get('page')  || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const [logs, total] = await Promise.all([
      db.backupLog.findMany({
        orderBy: { startedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.backupLog.count(),
    ]);

    // Summary stats
    const [successCount, failedCount, lastSuccess] = await Promise.all([
      db.backupLog.count({ where: { status: 'Success' } }),
      db.backupLog.count({ where: { status: 'Failed'  } }),
      db.backupLog.findFirst({ where: { status: 'Success' }, orderBy: { completedAt: 'desc' } }),
    ]);

    // DB row counts for display
    const [students, staff, payments, transactions] = await Promise.all([
      db.student.count(),
      db.staff.count(),
      db.feePayment.count(),
      db.libraryTransaction.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: { successCount, failedCount, lastSuccess, total },
        dbStats: { students, staff, payments, transactions },
      },
    });
  } catch (error) {
    console.error('Backup GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch backup logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body       = await request.json();
    const backupType = body.backupType || 'Full';
    const startedAt  = new Date();

    // Create in-progress log
    const log = await db.backupLog.create({
      data: {
        backupType,
        backupPath:  `/backups/${startedAt.toISOString().slice(0,10)}-${backupType.toLowerCase()}-backup.sql`,
        status:      'In-progress',
        startedAt,
      },
    });

    // Simulate backup — collect DB statistics
    const [
      studentCount, staffCount, paymentCount, attendanceCount,
      examCount, libraryCount,
    ] = await Promise.all([
      db.student.count(),
      db.staff.count(),
      db.feePayment.count(),
      db.attendance.count(),
      db.exam.count(),
      db.libraryTransaction.count(),
    ]);

    const totalRecords = studentCount + staffCount + paymentCount + attendanceCount + examCount + libraryCount;
    // Estimate size: ~1KB per record average
    const estimatedSizeMb = parseFloat((totalRecords * 0.001 + 0.5).toFixed(2));

    // Mark complete
    const completedLog = await db.backupLog.update({
      where: { id: log.id },
      data: {
        status:      'Success',
        backupSizeMb: estimatedSizeMb,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        log: completedLog,
        stats: { studentCount, staffCount, paymentCount, attendanceCount, examCount, libraryCount, totalRecords },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Backup POST error:', error);
    return NextResponse.json({ success: false, message: 'Backup failed' }, { status: 500 });
  }
}
