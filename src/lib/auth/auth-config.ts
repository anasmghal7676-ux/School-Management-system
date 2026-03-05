import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) return null;

          const user = await db.user.findFirst({
            where: {
              OR: [
                { username: credentials.username as string },
                { email: credentials.username as string },
              ],
            },
            include: { role: true },
          });

          if (!user || !user.isActive) return null;

          if (user.lockedUntil && user.lockedUntil > new Date()) return null;

          const isPasswordValid = await compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isPasswordValid) {
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
                ...(failedAttempts >= 5 && {
                  lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
                }),
              },
            });
            return null;
          }

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
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: {
              id: user.role.id,
              name: user.role.name,
              level: user.role.level,
              permissions,
            },
            schoolId: user.schoolId ?? undefined,
            twoFactorEnabled: user.twoFactorEnabled,
            isStaff: user.isStaff,
          };
        } catch (error) {
          console.error('[AUTH] authorize error:', error);
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
        token.schoolId = (user as any).schoolId;
        token.twoFactorEnabled = (user as any).twoFactorEnabled;
        token.isStaff = (user as any).isStaff;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).twoFactorEnabled = token.twoFactorEnabled;
        (session.user as any).isStaff = token.isStaff;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
