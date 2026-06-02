#!/bin/sh
# Container entrypoint: bring the database schema up to date, then start the
# app. Runs on every boot; `migrate deploy` only applies pending migrations
# and is a no-op when the schema is already current.
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Applying database migrations..."
  npx prisma migrate deploy
else
  echo "[entrypoint] DATABASE_URL not set; skipping migrations."
fi

echo "[entrypoint] Starting application: $*"
exec "$@"
