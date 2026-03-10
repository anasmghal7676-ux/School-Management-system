export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const checks: Record<string, any> = {};
  const start = Date.now();

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy', responseTime: Date.now() - start };
  } catch (e: any) {
    checks.database = { status: 'unhealthy', error: e.message };
  }

  // Count some key models
  try {
    const [students, staff, users] = await Promise.all([
      db.student.count(),
      db.staff.count(),
      db.user.count(),
    ]);
    checks.records = { students, staff, users };
  } catch {}

  const overallHealthy = checks.database?.status === 'healthy';
  return NextResponse.json({
    success: true,
    data: {
      status: overallHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      environment: process.env.NODE_ENV || 'production',
      version: '2.0.0',
      checks,
    },
  });
}
