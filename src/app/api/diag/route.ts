export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_len: process.env.NEXTAUTH_SECRET?.length ?? 0,
      NEXTAUTH_SECRET_prefix: process.env.NEXTAUTH_SECRET?.slice(0,8) ?? 'MISSING',
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_has_pgbouncer: process.env.DATABASE_URL?.includes('pgbouncer') ?? false,
      DATABASE_URL_prefix: (process.env.DATABASE_URL ?? 'MISSING').slice(0,60),
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'MISSING',
    },
    db: { status: 'untested' },
    user: null,
    bcrypt: null,
  };

  try {
    const user = await db.user.findFirst({
      where: { username: 'admin' },
      include: { role: true },
    });
    result.db.status = 'connected';
    if (user) {
      result.user = {
        found: true,
        username: user.username,
        isActive: user.isActive,
        failedAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        role: user.role?.name,
        level: user.role?.level,
        hash_prefix: user.passwordHash.slice(0,15),
      };
      const valid = await bcrypt.compare('admin123', user.passwordHash);
      result.bcrypt = { admin123_valid: valid };
    } else {
      result.user = { found: false, userCount: await db.user.count() };
    }
  } catch (e: any) {
    result.db = { status: 'error', error: e.message, code: e.code };
  }

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
