#!/usr/bin/env bash
# Deploy: pull, migrate, rebuild app. Run from anywhere.
set -euo pipefail

cd "$(dirname "$0")/.."

git pull

set -a
# shellcheck disable=SC1091
. ./.env
set +a

docker compose up -d postgres --wait
npx prisma migrate deploy

sha=$(git rev-parse --short HEAD)
build_log=$(mktemp)
trap 'rm -f "$build_log"' EXIT

start=$SECONDS
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build 2>&1 | tee "$build_log"
build_secs=$((SECONDS - start))

cached_steps=$(grep -cE '^#[0-9]+ CACHED$' "$build_log" || true)
deps=miss
app=miss
if grep -A1 'RUN pnpm install --frozen-lockfile' "$build_log" | grep -q CACHED; then
  deps=hit
fi
if grep -A1 'pnpm run build' "$build_log" | grep -q CACHED; then
  app=hit
fi

# One line per deploy — stdout (Actions logs) + local history on the runner.
metrics="DEPLOY_METRICS ts=$(date -u +%Y-%m-%dT%H:%M:%SZ) sha=$sha build_s=$build_secs deps=$deps app=$app cached_steps=$cached_steps"
echo "$metrics"
mkdir -p .deploy-metrics
echo "$metrics" >> .deploy-metrics/builds.log
