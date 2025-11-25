# Archived Docker artifacts

This file lists Docker-related artifacts that were previously part of the repository and have been archived as part of a migration to native (non-Docker) server deployment.

If you need to restore Docker-based development or CI workflows, consult your Git history or contact the repository owner.

Common artifacts (may be removed or archived):

- `docker-compose.yml`
- `docker-compose.production.yml`
- `docker-compose.db.yml`
- `docker-db.env` and `docker-db.env.example`
- `backend/Dockerfile`, `backend/.dockerignore`, `backend/docker-entrypoint.sh`, `backend/.env.docker`, `backend/env.docker.example`
- `scripts/db/bootstrap.sh`, `scripts/db/tail-logs.sh`

These were replaced by native setup scripts in `scripts/` and documentation under `Docs/SETUP_GUIDE.md`.

If you want the original files preserved, please restore them from the Git history (branch or commit prior to this change).
