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
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
