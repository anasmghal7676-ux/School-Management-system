import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ALWAYS use the correct pgbouncer URL - no conditionals
// Vercel dashboard URL may be wrong/outdated; this guarantees the correct connection
const CORRECT_DB_URL = "postgresql://postgres.gufbklktcqjufwzylkav:Xk9mT7vPq2Ls8ZaR@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: { db: { url: CORRECT_DB_URL } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db
