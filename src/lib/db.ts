import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Hardcoded fallback ensures DB connection works even if Vercel env vars are wrong
const DATABASE_URL = process.env.DATABASE_URL?.includes('pgbouncer')
  ? process.env.DATABASE_URL  // Already has pgbouncer params — use as-is
  : "postgresql://postgres.gufbklktcqjufwzylkav:Xk9mT7vPq2Ls8ZaR@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: DATABASE_URL } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db
