#!/bin/bash
# Run this script locally to push to GitHub
# Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME

USERNAME=${1:-"your-github-username"}
REPO="school-management"
TOKEN="YOUR_GITHUB_TOKEN"

echo "🚀 Creating GitHub repo and pushing..."

# Create repo via API
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO\",\"description\":\"Al-Noor School Management System - Full Stack Next.js\",\"private\":false,\"auto_init\":false}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Repo:', d.get('html_url', d.get('message','error')))"

echo ""
echo "📤 Setting remote and pushing..."

git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${TOKEN}@github.com/${USERNAME}/${REPO}.git"
git push -u origin main

echo ""
echo "✅ Done! View at: https://github.com/${USERNAME}/${REPO}"
