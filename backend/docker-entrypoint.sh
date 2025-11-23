#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[docker-entrypoint] Running Prisma migrations..."
  npx prisma migrate deploy
fi

echo "[docker-entrypoint] Starting application..."
exec "$@"

