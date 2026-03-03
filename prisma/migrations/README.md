# Database Migrations

## Setup Instructions

### Option 1: Prisma db push (Recommended for first setup)
```bash
# Set your DATABASE_URL and DIRECT_URL in .env.local
npx prisma db push
npm run db:seed
```

### Option 2: Run migrations
```bash
npx prisma migrate deploy
```

### Option 3: Supabase Dashboard
1. Go to your Supabase project → SQL Editor
2. Run: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`
3. Paste the output SQL into Supabase SQL Editor and execute

## After Setup
```bash
npm run db:seed   # Seeds 80 students, 15 staff, demo accounts
```
