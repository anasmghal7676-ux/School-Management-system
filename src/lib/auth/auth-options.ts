import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

// Fallback values ensure login works even if Vercel env vars aren't set
// These MUST match what's in your Vercel dashboard or .env.production
const NEXTAUTH_SECRET_VALUE =
  process.env.NEXTAUTH_SECRET ??
  "QAsU4y0QYrqaTMA07iPOXQfD2kHZmSHBfcLuOZ3sDVw=";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        try {
          const user = await db.user.findFirst({
            where: {
              OR: [
                { username: credentials.username.trim() },
                { email: credentials.username.trim() },
              ],
              isActive: true,
            },
            include: { role: true },
          });

          if (!user) {
            console.log("[Auth] User not found:", credentials.username);
            return null;
          }

          // Check account lockout
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.log("[Auth] Account locked:", user.username);
            return null;
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) {
            const attempts = (user.failedLoginAttempts ?? 0) + 1;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockedUntil: attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null,
              },
            });
            console.log("[Auth] Wrong password for:", user.username, "attempts:", attempts);
            return null;
          }

          // Success — reset counters
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
          });

          // Normalize permissions
          let permissions: string[] = [];
          try {
            const raw = user.role.permissions;
            if (Array.isArray(raw)) {
              permissions = raw.map(String);
            } else if (typeof raw === "string") {
              permissions = JSON.parse(raw);
            }
          } catch {
            permissions = [];
          }
          if (permissions.includes("*") || permissions.includes("*:*")) {
            permissions = ["*"];
          }

          console.log("[Auth] Login success:", user.username, "role:", user.role.name);

          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email ?? "",
            username: user.username,
            role: user.role.name,
            roleLevel: user.role.level,
            permissions,
            profilePhoto: user.profilePhoto ?? undefined,
            schoolId: user.schoolId ?? undefined,
          };
        } catch (err: any) {
          console.error("[Auth] DB error:", err.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.roleLevel = (user as any).roleLevel;
        token.permissions = (user as any).permissions;
        token.profilePhoto = (user as any).profilePhoto;
        token.schoolId = (user as any).schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.roleLevel = token.roleLevel as number;
        session.user.permissions = token.permissions as string[];
        session.user.profilePhoto = token.profilePhoto as string | undefined;
        session.user.schoolId = token.schoolId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  secret: NEXTAUTH_SECRET_VALUE,
  debug: false,
};
