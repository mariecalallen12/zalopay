#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.db.yml"
ENV_FILE="${1:-${REPO_ROOT}/docker-db.env}"
BACKEND_DIR="${REPO_ROOT}/backend"

if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker is not installed or not in PATH" >&2
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "[ERROR] Docker Compose V2 is required (docker compose command missing)" >&2
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "[ERROR] Compose file not found at ${COMPOSE_FILE}" >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  cat <<EOF >&2
[ERROR] Environment file not found: ${ENV_FILE}
Create it by copying docker-db.env.example and adjust values:
  cp docker-db.env.example docker-db.env
EOF
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

: "${DB_NAME:?DB_NAME is required in ${ENV_FILE}}"
: "${DB_USER:?DB_USER is required in ${ENV_FILE}}"
: "${DB_PASSWORD:?DB_PASSWORD is required in ${ENV_FILE}}"
: "${DB_HOST_PORT:?DB_HOST_PORT is required in ${ENV_FILE}}"

echo "[INFO] Starting Postgres stack via Docker Compose"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d

echo "[INFO] Waiting for Postgres to become healthy"
ATTEMPTS=30
until docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U "${DB_USER}" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS - 1))
  if [ "${ATTEMPTS}" -le 0 ]; then
    echo "[ERROR] Postgres did not become ready in time" >&2
    docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs postgres >&2 || true
    exit 1
  fi
  sleep 2
done

echo "[INFO] Postgres is ready. Running migrations and seed scripts"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_HOST_PORT}/${DB_NAME}"

pushd "${BACKEND_DIR}" >/dev/null
npm run db:migrate
npm run db:seed
npm run db:health
popd >/dev/null

echo "[INFO] Database bootstrap sequence completed successfully"
