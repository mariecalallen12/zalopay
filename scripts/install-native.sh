#!/usr/bin/env bash
set -euo pipefail

# scripts/install-native.sh
# Installs system dependencies for native deployment (Ubuntu 20.04+),
# installs Node.js, PM2, PostgreSQL, sets up DB/user, installs app deps,
# generates Prisma client, runs migrations and seeds, and builds admin UI.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "== ZaloPay native install script =="

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root or with sudo"
  exit 1
fi

apt update
apt install -y curl git build-essential nginx postgresql postgresql-contrib ca-certificates

# Install Node.js LTS (Node 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v || true
npm -v || true

# Install PM2 globally
npm install -g pm2

echo "Create postgres user and database (zalopay)"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE USER zalopay WITH PASSWORD 'changeme_replace_this_password';
CREATE DATABASE zalopay OWNER zalopay;
GRANT ALL PRIVILEGES ON DATABASE zalopay TO zalopay;
\q
SQL

echo "Setting up application files and dependencies"
cd "$ROOT_DIR/backend"

if [ -f package.json ]; then
  npm install --production
fi

echo "Generating Prisma client"
npm run db:generate || true

echo "Applying migrations"
npm run db:migrate || true

echo "Seeding database (if seed script present)"
npm run db:seed || true

echo "Build admin UI (if present)"
if [ -d "$ROOT_DIR/static/admin" ]; then
  cd "$ROOT_DIR/static/admin"
  npm install --production
  npm run build || true
fi

echo "Create storage directories and logs"
mkdir -p "$ROOT_DIR/backend/storage/identity" \
  "$ROOT_DIR/backend/storage/documents" \
  "$ROOT_DIR/backend/storage/exports" \
  "$ROOT_DIR/backend/logs"
chown -R $SUDO_USER:$SUDO_USER "$ROOT_DIR/backend/storage" "$ROOT_DIR/backend/logs"

echo "Native install complete. Next: configure backend/.env and run scripts/setup-pm2.sh as regular user"

exit 0
