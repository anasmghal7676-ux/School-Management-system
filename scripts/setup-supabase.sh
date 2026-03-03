#!/bin/bash
# Al-Noor School Management - Supabase Setup Script
set -e

echo "🚀 Setting up database on Supabase..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set. Copy .env.example to .env.local first."
  exit 1
fi

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🗄️  Pushing schema to PostgreSQL..."
npx prisma db push --accept-data-loss

echo "🌱 Seeding demo data..."
npm run db:seed

echo ""
echo "✅ Done! Visit http://localhost:3000 and login with admin / admin123"
