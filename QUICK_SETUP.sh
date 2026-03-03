#!/bin/bash
# =======================================================
# Al-Noor School Management - QUICK SETUP (Run locally)
# =======================================================
set -e

GH_TOKEN="YOUR_GITHUB_TOKEN"
REPO_NAME="School-Management-system"
GH_USER="anasmghal7676-ux"

echo "=========================================="
echo "  Al-Noor School Management Quick Setup"
echo "=========================================="

# Get GitHub username
echo ""
echo "📋 Step 1: Getting your GitHub username..."
GH_USER=$(curl -s -H "Authorization: token $GH_TOKEN" https://api.github.com/user | python3 -c "import sys,json; print(json.load(sys.stdin)['login'])")
echo "   Username: $GH_USER"

# Create GitHub repo
echo ""
echo "📦 Step 2: Creating GitHub repository..."
curl -s -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Al-Noor School Management System - Next.js + PostgreSQL\",\"private\":false}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅ Created:', d.get('html_url', d.get('message','')))"

# Push code
echo ""
echo "⬆️  Step 3: Pushing code to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"
git push -u origin main

echo ""
echo "✅ Code pushed to: https://github.com/${GH_USER}/${REPO_NAME}"

# Supabase instructions
echo ""
echo "=========================================="
echo "  NEXT: Setup Supabase Database"
echo "=========================================="
echo ""
echo "1. Go to https://supabase.com → Your Project"
echo "2. Settings → General → Copy 'Reference ID'"
echo "3. Edit .env.local - replace YOUR_PROJECT_REF with it"
echo "4. Run: npx prisma db push && npm run db:seed"
echo ""
echo "=========================================="
echo "  NEXT: Deploy to Vercel"
echo "=========================================="
echo ""
echo "Option A (CLI):"
echo "  npm install -g vercel && vercel --prod"
echo ""
echo "Option B (Dashboard):"
echo "  1. vercel.com → New Project"
echo "  2. Import: https://github.com/${GH_USER}/${REPO_NAME}"
echo "  3. Add env vars from .env.production"
echo "  4. Deploy!"
echo ""
echo "✅ All done! Your project URL will be shown after Vercel deploy."
