#!/usr/bin/env bash
# Incremental production deploy. Invoked by CI/CD via SSH after the
# VM has been bootstrapped by setup-production-server.sh.
#
# Steps:
#   1. Fetch latest main
#   2. Rebuild app + migrate images
#   3. Run drizzle migrations (one-shot container, exits 0 if no-op)
#   4. Replace the app container with the new image
#   5. Health-check
#
# Run as the deploy user (member of docker group). Idempotent.

set -euo pipefail

DEPLOY_DIR="/opt/10kdjo"
COMPOSE="docker compose -f docker-compose.prod.yml"

cd "$DEPLOY_DIR"

step() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }

step "Fetching origin/main"
git fetch --prune origin
git checkout main
git reset --hard origin/main

step "Building images"
$COMPOSE build app migrate

step "Ensuring postgres is up"
$COMPOSE up -d postgres

step "Running migrations"
$COMPOSE run --rm migrate

step "Recreating app container with new image"
$COMPOSE up -d --no-deps app

step "Waiting for app health"
for i in {1..30}; do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
    echo "App healthy."
    exit 0
  fi
  sleep 2
done

echo "ERROR: app did not become healthy in 60s. Recent logs:" >&2
$COMPOSE logs --tail=80 app >&2
exit 1
