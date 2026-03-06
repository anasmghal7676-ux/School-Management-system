export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await db.user.count();
    const roleCount = await db.role.count();
    return NextResponse.json({
      status: "ok",
      db: "connected",
      users: userCount,
      roles: roleCount,
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      error: err.message,
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
      }
    }, { status: 500 });
  }
}
