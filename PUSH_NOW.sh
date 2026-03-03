#!/bin/bash
# ================================================
# Run this script on YOUR COMPUTER to push code
# ================================================

TOKEN="YOUR_GITHUB_TOKEN"
REPO="https://github.com/anasmghal7676-ux/School-Management-system.git"

git remote remove origin 2>/dev/null || true
git remote add origin "https://anasmghal7676-ux:${TOKEN}@github.com/anasmghal7676-ux/School-Management-system.git"
git push -u origin main --force

echo "✅ Done! https://github.com/anasmghal7676-ux/School-Management-system"
