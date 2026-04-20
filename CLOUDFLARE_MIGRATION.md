# 🚀 Migrate School Management System: Vercel → Cloudflare

## What's been set up for you

| File | Purpose |
|------|---------|
| `open-next.config.ts` | OpenNext Cloudflare adapter config |
| `wrangler.jsonc` | Cloudflare Worker deployment config |
| `.env.cloudflare.example` | All env vars you need to set |
| `package.json` scripts | `build:cf`, `deploy:cf`, `preview:cf` |

---

## Step 1 — Create Cloudflare Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** → **Create**
3. Select **Worker** (not Pages)
4. Name it: `school-management-system`
5. Click **Deploy** (blank template is fine — we'll overwrite it)

---

## Step 2 — Set Environment Variables

1. Go to **Workers & Pages** → `school-management-system` → **Settings** → **Variables and Secrets**
2. Add every variable from `.env.cloudflare.example`
3. Mark secrets (DATABASE_URL, NEXTAUTH_SECRET, etc.) as **Secret** type

---

## Step 3 — Connect GitHub (Auto-deploys)

1. In the Worker settings → **Git** tab → **Connect Repository**
2. Select `anasmghal7676-ux/School-Management-system`
3. Branch: `main`
4. Build command: `npm run build:cf`
5. Save

---

## Step 4 — Deploy Manually (First Time)

Run locally from the project root:

```bash
# Install deps
npm install --legacy-peer-deps

# Build for Cloudflare
npm run build:cf

# Deploy to Cloudflare (requires wrangler login first)
npx wrangler login
npm run deploy:cf
```

---

## Step 5 — Set Custom Domain (Optional)

1. Go to Worker → **Settings** → **Domains & Routes**
2. Add your custom domain (e.g., `school.yourdomain.com`)
3. Update `NEXTAUTH_URL` env var to match

---

## Login Credentials (unchanged)

| Role | Email | Password |
|------|-------|---------|
| Super Admin | admin@school.com | Admin@123 |
| Principal | principal@school.com | Admin@123 |
| Teacher | teacher@school.com | Admin@123 |

---

## Important Notes

### Prisma on Cloudflare
- Cloudflare Workers run on the edge — use Supabase **connection pooler** URL (port 6543)
- The `DATABASE_URL` must use the pooler, not the direct connection
- `DIRECT_URL` (port 5432) is used for migrations only

### NextAuth on Cloudflare
- `NEXTAUTH_URL` must be set to your full Worker URL
- Use a strong random `NEXTAUTH_SECRET` (at least 32 chars)

### If you need to rollback to Vercel
- Just re-enable the Vercel project — nothing is deleted
- Both can run simultaneously during transition

---

## Vercel Security — What to Check

If you suspect Vercel was compromised:
1. Go to vercel.com → **Settings** → **Tokens** — revoke all tokens
2. Go to **Settings** → **Git** — disconnect and reconnect GitHub
3. Rotate `NEXTAUTH_SECRET` and update it everywhere
4. Check Supabase audit logs for suspicious activity
5. Rotate Supabase database password if needed
