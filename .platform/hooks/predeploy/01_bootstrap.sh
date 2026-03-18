#!/bin/bash
set -euo pipefail

exec > >(tee -a /var/log/parqara-predeploy.log) 2>&1

cd /var/app/staging

echo "[$(date -Is)] Starting Parqara predeploy bootstrap"

if [[ "${SKIP_DB_BOOTSTRAP:-false}" == "true" ]]; then
  echo "[$(date -Is)] Skipping database bootstrap because SKIP_DB_BOOTSTRAP=true"
  exit 0
fi

run_with_timeout() {
  local label="$1"
  local seconds="$2"
  shift 2

  echo "[$(date -Is)] ${label} started (timeout: ${seconds}s)"

  if command -v timeout >/dev/null 2>&1; then
    timeout "${seconds}" "$@"
  else
    "$@"
  fi

  echo "[$(date -Is)] ${label} completed"
}

run_with_timeout "Prisma migrate deploy" "${DB_MIGRATE_TIMEOUT_SECONDS:-240}" npm run db:migrate:deploy

if [[ "${RUN_DB_SEED_ON_DEPLOY:-false}" == "true" ]]; then
  run_with_timeout "Prisma seed" "${DB_SEED_TIMEOUT_SECONDS:-240}" npm run db:seed
else
  echo "[$(date -Is)] Skipping Prisma seed because RUN_DB_SEED_ON_DEPLOY is not true"
fi

echo "[$(date -Is)] Parqara predeploy bootstrap finished"
