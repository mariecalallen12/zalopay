#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.db.yml"
ENV_FILE="${1:-${REPO_ROOT}/docker-db.env}"

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

echo "[INFO] Tailing Postgres container logs (press Ctrl+C to exit)"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs -f postgres
