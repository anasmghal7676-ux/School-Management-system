export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Temporary debug endpoint — tests the full auth flow
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    // Step 1: DB connection
    let user: any;
    try {
      user = await db.user.findFirst({
        where: {
          OR: [{ username: username.trim() }, { email: username.trim() }],
        },
        include: { role: true },
      });
    } catch (dbErr: any) {
      return NextResponse.json({
        step: "db_query",
        error: dbErr.message,
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          dbUrlStart: process.env.DATABASE_URL?.slice(0, 40),
          hasSecret: !!process.env.NEXTAUTH_SECRET,
        }
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        step: "user_lookup",
        found: false,
        searched: username.trim(),
        dbConnected: true,
        userCount: await db.user.count(),
      });
    }

    // Step 2: Check active & lock
    if (!user.isActive) return NextResponse.json({ step: "check_active", isActive: false });
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ step: "check_locked", lockedUntil: user.lockedUntil });
    }

    // Step 3: Password check
    const valid = await bcrypt.compare(password, user.passwordHash);
    return NextResponse.json({
      step: "complete",
      found: true,
      username: user.username,
      isActive: user.isActive,
      role: user.role?.name,
      roleLevel: user.role?.level,
      passwordValid: valid,
      failedAttempts: user.failedLoginAttempts,
      hashPrefix: user.passwordHash.slice(0, 7),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
