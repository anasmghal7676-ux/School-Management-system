#!/bin/bash
echo "Setting Vercel environment variables..."

# Install vercel CLI if needed
npm i -g vercel 2>/dev/null

# Set each env var
echo "postgresql://postgres.gufbklktcqjufwzylkav:Xk9mT7vPq2Ls8ZaR@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" | vercel env add DATABASE_URL production
echo "postgresql://postgres:Xk9mT7vPq2Ls8ZaR@db.gufbklktcqjufwzylkav.supabase.co:5432/postgres" | vercel env add DIRECT_URL production
echo "c55b68712bacf2a5549cd81436493e0f7811b194bde1bb7fd4419cd9af986ad0" | vercel env add NEXTAUTH_SECRET production
echo "https://school-management-system-anasmghal7676-uxs-projects.vercel.app" | vercel env add NEXTAUTH_URL production

echo "✅ All env vars set! Triggering redeploy..."
vercel --prod
