#!/usr/bin/env bash
# Ephemeral demo boot: postgres + redis -> schema+seed -> API -> static web behind one port.
set -euo pipefail

trap 'echo "[boot] FAILED at line $LINENO"; tail -n 40 /tmp/pg.log /tmp/api.log /tmp/redis.log 2>/dev/null || true' ERR

wait_for() {
  local url=$1 label=$2 log=$3
  for _ in $(seq 1 60); do curl -fsS "$url" >/dev/null 2>&1 && return 0; sleep 2; done
  echo "[boot] $label never became ready at $url"
  tail -n 60 "$log" 2>/dev/null || true
  exit 1
}

export PGDATA=/tmp/pg
PUBLIC_PORT="${PORT:-7860}"
export NODE_ENV=production API_PORT=4000
export NODE_OPTIONS="--max-old-space-size=180"
export DATABASE_URL="postgresql://flowforge@127.0.0.1:5433/nexora?schema=public"
export REDIS_URL="redis://127.0.0.1:6379"
export SESSION_SECRET="${SESSION_SECRET:-demo-only-session-secret-0123456789abcdef}"
export WEB_ORIGIN="${RENDER_EXTERNAL_URL:-https://nexora-demo.onrender.com}"
export COOKIE_SECURE=false

PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | head -1)"
[ -n "$PGBIN" ] || { echo "[boot] postgres binaries not found"; exit 1; }
export PATH="$PGBIN:$PATH"

if [ "$(id -u)" = "0" ]; then PG="su postgres -c"; mkdir -p "$PGDATA" && chown -R postgres:postgres "$PGDATA"
else PG="bash -c"; mkdir -p "$PGDATA"; fi

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "[boot] initdb ($PGBIN)"
  $PG "$PGBIN/initdb -D '$PGDATA' -U flowforge -A trust -E UTF8"
fi

echo "[boot] postgres"
$PG "$PGBIN/pg_ctl -D '$PGDATA' -o '-p 5433 -k /tmp -c shared_buffers=24MB -c max_connections=10 -c work_mem=2MB -c fsync=off' -l /tmp/pg.log -w start"
until "$PGBIN/pg_isready" -h 127.0.0.1 -p 5433 -U flowforge >/dev/null 2>&1; do sleep 1; done
$PG "$PGBIN/createdb -h 127.0.0.1 -p 5433 -U flowforge nexora" 2>/dev/null || true

echo "[boot] redis"
redis-server --port 6379 --save "" --appendonly no --maxmemory 24mb --maxmemory-policy allkeys-lru --daemonize yes --logfile /tmp/redis.log
for _ in $(seq 1 20); do redis-cli -p 6379 ping >/dev/null 2>&1 && break; sleep 1; done

echo "[boot] schema + seed"
cd /app
npx prisma db push --skip-generate --accept-data-loss --schema apps/api/prisma/schema.prisma
npm run db:seed -w @nexora/api || npx tsx apps/api/prisma/seed.ts || echo "[boot] seed skipped"

echo "[boot] api"
cd /app/apps/api
node dist/src/server.js > /tmp/api.log 2>&1 &
wait_for http://127.0.0.1:4000/api/health "api" /tmp/api.log

echo "[boot] ready on port $PUBLIC_PORT"
( free -m 2>/dev/null || true; ps -o pid,rss,comm -C node 2>/dev/null || true ) | sed 's/^/[mem] /'
exec env PORT="$PUBLIC_PORT" node /proxy.js
