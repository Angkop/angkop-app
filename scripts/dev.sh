#!/usr/bin/env bash
# One-command local dev: the FastAPI ML service, then the Next.js dashboard + Express API
# (via turbo). Postgres + Redis are the cloud Supabase/Upstash instances configured in
# apps/server/.env and ml/.env, not local Docker containers — see DEPLOYMENT.md.
# Ctrl+C stops the JS apps and the ML service.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ML_LOG="$REPO_ROOT/ml/.dev-server.log"
ML_PID=""

cleanup() {
  if [ -n "$ML_PID" ] && kill -0 "$ML_PID" 2>/dev/null; then
    echo "==> Stopping ML service (pid $ML_PID)..."
    kill "$ML_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [ ! -d "$REPO_ROOT/ml/.venv" ]; then
  echo "!! ml/.venv not found — run the ML setup first (see ml/README.md), then re-run this." >&2
  exit 1
fi

echo "==> Starting ML service (FastAPI, :8000)..."
(
  cd "$REPO_ROOT/ml"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  # --reload-dir scopes the file watcher to app/ only — without it, uvicorn watches the
  # whole ml/ directory, including this script's own log file below, which would
  # otherwise retrigger a reload (and drop in-flight requests) every time it's written to.
  exec uvicorn app.main:app --reload --reload-dir app --port 8000
) > "$ML_LOG" 2>&1 &
ML_PID=$!

echo "==> Waiting for ML service..."
until curl -s http://localhost:8000/health >/dev/null 2>&1; do
  if ! kill -0 "$ML_PID" 2>/dev/null; then
    echo "!! ML service failed to start — see $ML_LOG" >&2
    exit 1
  fi
  sleep 1
done

echo "==> All infra ready:"
echo "    Dashboard:  http://localhost:3000"
echo "    GraphQL:    http://localhost:4000/graphql"
echo "    ML docs:    http://localhost:8000/docs"
echo ""
echo "==> Starting web + server (turbo dev)..."
pnpm exec turbo dev
