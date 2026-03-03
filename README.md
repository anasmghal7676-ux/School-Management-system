# 🏫 Al-Noor School Management System

A **production-ready, full-stack school management system** built with Next.js 15, Prisma ORM, PostgreSQL (Supabase), and Tailwind CSS. Designed for Pakistani schools managing 500K+ students.

---

## ✨ Features

### Core Modules (173+)
- **Students** — Enrollment, profiles, progress tracking
- **Staff** — HR, payroll, attendance, transfers
- **Fees** — Collection, installments, defaulters, receipts
- **Attendance** — Daily marking, reports, analytics
- **Exams & Marks** — Results, report cards, grade books
- **Timetable** — Weekly schedule builder with drag & drop
- **Library** — Books, issue/return, analytics
- **Hostel** — Rooms, attendance, fees
- **Transport** — Routes, vehicles, tracking
- **Finance** — Budgets, expenses, payroll, reports
- **Communication** — SMS/Email/WhatsApp to parents
- **RBAC** — 10-level role hierarchy with 40+ permissions

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 6
- **Auth**: NextAuth.js v5
- **UI**: shadcn/ui + Tailwind CSS
- **Validation**: Zod
- **PDF**: Puppeteer + @react-pdf/renderer
- **Deployment**: Vercel

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/school-management.git
cd school-management
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env.local
# Fill in your Supabase DATABASE_URL and NEXTAUTH_SECRET
```

### 3. Setup Database
```bash
# Run migrations
npx prisma migrate deploy

# OR push schema directly (first time)
npx prisma db push

# Seed with demo data
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo Accounts** (password: `admin123`)
| Role | Username |
|------|----------|
| Super Admin | `admin` |
| Principal | `principal` |
| Accountant | `accountant` |
| Teacher | `teacher1` |
| Receptionist | `receptionist` |

---

## 🗄️ Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Connection String** (Transaction mode, port 6543)
3. Add to `.env.local`:
```env
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
```
4. Run: `npx prisma db push && npm run db:seed`

---

## ☁️ Deploy to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/school-management)

### Manual Deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Required Environment Variables on Vercel
```
DATABASE_URL          → Supabase pooled connection (port 6543)
DIRECT_URL            → Supabase direct connection (port 5432)
NEXTAUTH_SECRET       → Random 32+ char string
NEXTAUTH_URL          → Your Vercel deployment URL
```

---

## 📁 Project Structure

```
school-management/
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # 263 API routes
│   │   ├── students/      # Student management
│   │   ├── staff/         # Staff management
│   │   ├── fees/          # Fee management
│   │   ├── fin-dash/      # Financial dashboard
│   │   ├── cls-timetable/ # Class timetable
│   │   ├── teach-portal/  # Teacher portal
│   │   └── ...            # 170+ more modules
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utilities & helpers
│   │   ├── db.ts          # Prisma client
│   │   ├── rbac.ts        # Role-based access control
│   │   ├── api-auth.ts    # API auth helpers
│   │   └── validations/   # Zod schemas
│   └── hooks/             # Custom React hooks
├── prisma/
│   ├── schema.prisma      # 60+ models
│   └── seed.ts            # Demo data (80 students, 15 staff)
├── .env.example           # Environment template
├── vercel.json            # Vercel deployment config
└── next.config.ts         # Next.js configuration
```

---

## 🔐 RBAC Roles

| Level | Role | Access |
|-------|------|--------|
| 10 | Super Admin | Everything |
| 9 | Principal | All except system settings |
| 8 | Vice Principal | Academic modules |
| 7 | Administrator | Student/staff management |
| 6 | Accountant | Finance modules |
| 5 | Coordinator | Academic coordination |
| 4 | Teacher | Marks, attendance |
| 3 | Librarian | Library module |
| 2 | Receptionist | Front desk |
| 1 | Parent | View only |

---

## 📊 Stats
- **95,000+** lines of code
- **173** functional modules
- **263** API routes
- **60+** Prisma models
- **176** pages
- **0** TypeScript errors

---

## 📄 License
MIT © Al-Noor School Management System
