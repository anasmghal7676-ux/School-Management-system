# 🚀 Deployment Guide — Al-Noor School Management System

## Prerequisites
- Node.js 18+
- Git configured with your GitHub account
- Supabase account
- Vercel account

---

## Step 1: Get Supabase Project Reference

1. Go to [supabase.com](https://supabase.com) → Your Project
2. Click **Project Settings** → **General**
3. Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

---

## Step 2: Update Database URLs

Edit `.env.local` and replace `YOUR_PROJECT_REF` with your Reference ID:

```env
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:YOUR_DB_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abcdefghijklmnop:YOUR_DB_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

> **Note:** The region (`ap-southeast-1`) may differ. Check your Supabase project's region.

---

## Step 3: Push Database Schema

```bash
npm install
npx prisma db push
npm run db:seed
```

This creates all 78 tables and seeds demo data (80 students, 15 staff, 5 user accounts).

**Demo Login Credentials:**
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Super Admin |
| principal | admin123 | Principal |
| accountant | admin123 | Accountant |
| teacher1 | admin123 | Teacher |
| receptionist | admin123 | Receptionist |

---

## Step 4: Create GitHub Repository & Push

```bash
# Create repo on GitHub (run this once)
gh repo create school-management --public --description "Al-Noor School Management System"

# OR manually on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/school-management.git
git push -u origin main
```

---

## Step 5: Deploy to Vercel

### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Add Environment Variables (copy from `.env.production`):
   - `DATABASE_URL`
   - `DIRECT_URL`  
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → set to your Vercel URL

4. Deploy!

### Option C: One-Click (after pushing to GitHub)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Supabase Region URLs

| Region | Host |
|--------|------|
| Southeast Asia | `aws-0-ap-southeast-1.pooler.supabase.com` |
| South Asia (Mumbai) | `aws-0-ap-south-1.pooler.supabase.com` |
| US East | `aws-0-us-east-1.pooler.supabase.com` |
| EU West | `aws-0-eu-west-1.pooler.supabase.com` |

Pick the region closest to your users (Pakistan → ap-south-1 recommended).

---

## Troubleshooting

**"Can't reach database server"**
→ Check Supabase project is not paused (free tier pauses after 1 week inactivity)

**"Invalid connection string"**  
→ Make sure you're using port 6543 (transaction pooler) for `DATABASE_URL`
→ Use port 5432 for `DIRECT_URL` only

**Prisma migration errors**
→ Run `npx prisma db push --force-reset` (WARNING: deletes all data)

**Build fails on Vercel**
→ Make sure all env vars are set in Vercel Dashboard
→ Check `vercel logs` for specific error
