import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

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
                { username: credentials.username },
                { email: credentials.username },
              ],
              isActive: true,
            },
            include: { role: true },
          });
          if (!user) return null;

          // Check account lockout
          if (user.lockedUntil && user.lockedUntil > new Date()) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) {
            const attempts = (user.failedLoginAttempts ?? 0) + 1;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockedUntil: attempts >= 5
                  ? new Date(Date.now() + 30 * 60 * 1000)
                  : undefined,
              },
            });
            return null;
          }

          // Reset on success
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLogin: new Date(),
            },
          });

          const permissions = Array.isArray(user.role.permissions)
            ? user.role.permissions
            : typeof user.role.permissions === 'string'
            ? JSON.parse(user.role.permissions)
            : [];

          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email ?? '',
            username: user.username,
            role: user.role.name,
            roleLevel: user.role.level,
            permissions,
            profilePhoto: user.profilePhoto ?? undefined,
          };
        } catch (err) {
          console.error('[Auth] authorize error:', err);
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
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
