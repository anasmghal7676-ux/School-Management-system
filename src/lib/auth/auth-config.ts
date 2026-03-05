import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Find user by username or email
        const user = await db.user.findFirst({
          where: {
            OR: [
              { username: credentials.username as string },
              { email: credentials.username as string },
            ],
          },
          include: {
            role: true,
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        // Verify password
        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          // Increment failed login attempts
          const failedAttempts = user.failedLoginAttempts + 1;
          const maxAttempts = 5;

          const updateData: any = {
            failedLoginAttempts: failedAttempts,
          };

          // Lock account after max attempts
          if (failedAttempts >= maxAttempts) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          }

          await db.user.update({
            where: { id: user.id },
            data: updateData,
          });

          return null;
        }

        // Reset failed login attempts on successful login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLogin: new Date(),
          },
        });

        // Parse permissions (Prisma returns Json as object, not string)
        const permissions = user.role.permissions
          ? (typeof user.role.permissions === 'string'
              ? JSON.parse(user.role.permissions)
              : user.role.permissions)
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
          schoolId: user.schoolId,
          twoFactorEnabled: user.twoFactorEnabled,
          isStaff: user.isStaff,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.isStaff = user.isStaff;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as any;
        session.user.schoolId = token.schoolId as string | undefined;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.isStaff = token.isStaff as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
};
