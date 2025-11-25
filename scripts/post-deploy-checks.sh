#!/usr/bin/env bash
set -euo pipefail

# scripts/post-deploy-checks.sh
# Run a sequence of verification commands after native deployment.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

echo "== Post-deploy checks =="

echo "1) Check backend health endpoint"
curl -fsS http://localhost:3000/health || echo "Health endpoint returned non-2xx"

echo "2) Run Prisma DB health script (if available)"
if [ -f "$BACKEND_DIR/package.json" ]; then
  (cd "$BACKEND_DIR" && npm run db:health) || echo "db:health failed or not configured"
fi

echo "3) Check PM2 status"
pm2 status || true

echo "4) Tail last 100 lines of backend logs (pm2)"
pm2 logs zalopay-backend --lines 100 --nostream || true

echo "5) Check PostgreSQL service"
systemctl is-active --quiet postgresql && echo "postgresql active" || echo "postgresql not active"

echo "Post-deploy checks finished"

exit 0
