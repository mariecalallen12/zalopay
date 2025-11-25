#!/usr/bin/env bash
set -euo pipefail

# scripts/setup-pm2.sh
# Start PM2 processes from ecosystem.config.js and configure startup on boot.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "== PM2 setup: starting apps from ecosystem.config.js =="

if [ ! -f "$ROOT_DIR/ecosystem.config.js" ]; then
  echo "Missing ecosystem.config.js in $ROOT_DIR"
  exit 1
fi

# Start apps (production env)
pm2 start "$ROOT_DIR/ecosystem.config.js" --env production

echo "Saving PM2 process list"
pm2 save

echo "Generating systemd startup script (run as current user)"
USER_NAME=${SUDO_USER:-$(whoami)}
pm2 startup systemd -u "$USER_NAME" --hp "/home/$USER_NAME"

echo "PM2 setup complete. Check status with: pm2 status"

exit 0
