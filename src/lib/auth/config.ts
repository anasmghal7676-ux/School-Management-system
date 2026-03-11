import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await db.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { username: credentials.email },
              ],
            },
            include: { role: true },
          });

          if (!user || !user.isActive) return null;

          // Check account lockout
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error('Account locked. Try again later.');
          }

          const isValid = await compare(credentials.password, user.passwordHash);

          if (!isValid) {
            // Increment failed attempts
            const attempts = (user.failedLoginAttempts || 0) + 1;
            const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                ...(lockUntil ? { lockedUntil: lockUntil } : {}),
              },
            });
            // Log failed attempt
            try {
              await (db as any).loginAttempt?.create({
                data: { userId: user.id, success: false, ipAddress: 'unknown' },
              });
            } catch {}
            return null;
          }

          // Reset failed attempts on success
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLogin: new Date(),
            },
          });

          // Log successful attempt
          try {
            await (db as any).loginAttempt?.create({
              data: { userId: user.id, success: true, ipAddress: 'unknown' },
            });
          } catch {}

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role.name,
            schoolId: user.schoolId,
          };
        } catch (err: any) {
          if (err.message === 'Account locked. Try again later.') throw err;
          console.error('[AUTH ERROR]', err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  jwt: { maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.username = (user as any).username ?? (user as any).email ?? '';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).username = token.username ?? '';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
