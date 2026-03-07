import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

const SECRET = "QAsU4y0QYrqaTMA07iPOXQfD2kHZmSHBfcLuOZ3sDVw=";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize() called");
        
        if (!credentials?.username || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        const uname = credentials.username.trim();
        console.log("[AUTH] Looking up user:", uname);

        try {
          const user = await db.user.findFirst({
            where: {
              OR: [{ username: uname }, { email: uname }],
              isActive: true,
            },
            include: { role: true },
          });

          if (!user) {
            console.log("[AUTH] User not found or inactive:", uname);
            return null;
          }

          console.log("[AUTH] User found:", user.username, "role:", user.role?.name);

          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.log("[AUTH] Account locked until:", user.lockedUntil);
            return null;
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log("[AUTH] Password valid:", valid);

          if (!valid) {
            const attempts = (user.failedLoginAttempts ?? 0) + 1;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockedUntil: attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null,
              },
            }).catch(e => console.log("[AUTH] Failed to update attempts:", e.message));
            return null;
          }

          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
          }).catch(e => console.log("[AUTH] Failed to update lastLogin:", e.message));

          let permissions: string[] = [];
          try {
            const raw = user.role.permissions;
            permissions = Array.isArray(raw) ? raw.map(String) : JSON.parse(raw as string);
          } catch { permissions = []; }
          if (permissions.includes("*") || permissions.includes("*:*")) permissions = ["*"];

          console.log("[AUTH] Login SUCCESS for:", user.username);

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
          } as any;
        } catch (err: any) {
          console.error("[AUTH] CRITICAL DB ERROR:", err.message, err.code, err.stack?.slice(0, 300));
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
  pages: { signIn: "/auth/login", error: "/auth/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  secret: SECRET,
  debug: true, // Enable full debug logging
};
