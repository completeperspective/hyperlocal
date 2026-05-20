#!/bin/bash
set -euo pipefail

# Source .env from project root if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=../.env
  source "$ENV_FILE"
  set +a
fi

SOURCE_URL="${DATABASE_URL:-}"
TARGET_URL="${PROD_DATABASE_URL:-}"

mask_url() {
  echo "$1" | sed 's|://[^:]*:[^@]*@|://*****:*****@|'
}

if [ -z "$SOURCE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Check your .env file."
  exit 1
fi

if [ -z "$TARGET_URL" ]; then
  echo "ERROR: PROD_DATABASE_URL is not set. Add it to your .env file."
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve pg_dump strategy:
#   1. Local binary if version matches the server
#   2. Docker container running a postgres image
#   3. Error with instructions
# ---------------------------------------------------------------------------
resolve_pg_dump() {
  # Get server major version via psql if available
  local server_major=""
  if command -v psql &>/dev/null; then
    server_major=$(psql -d "$SOURCE_URL" -t \
      -c "SELECT current_setting('server_version_num')::int / 10000;" \
      2>/dev/null | tr -d ' \n') || true
  fi

  # Prefer local pg_dump when version matches (or when we cannot determine the server version)
  if command -v pg_dump &>/dev/null; then
    local client_major
    client_major=$(pg_dump --version | grep -oE '[0-9]+' | head -1)
    if [ -z "$server_major" ] || [ "$client_major" = "$server_major" ]; then
      echo "local"
      return
    fi
  fi

  # Fall back to any running postgres Docker container
  if command -v docker &>/dev/null; then
    local container
    # Reason: match on image name rather than container name — portable across projects
    container=$(docker ps --format "{{.Names}}\t{{.Image}}" \
      | awk -F'\t' 'tolower($2) ~ /postgres/ {print $1}' \
      | head -1)
    if [ -n "$container" ]; then
      echo "docker:$container"
      return
    fi
  fi

  echo ""
}

PG_DUMP_MODE=$(resolve_pg_dump)

if [ -z "$PG_DUMP_MODE" ]; then
  echo "ERROR: No compatible pg_dump found."
  echo "  Options:"
  echo "    - Install postgresql-client matching your server version"
  echo "    - Start a local Postgres Docker container"
  exit 1
fi

# ---------------------------------------------------------------------------
# Confirm with user
# ---------------------------------------------------------------------------
echo ""
echo "  DATABASE CLONE — LOCAL -> PROD"
echo "  ================================================="
echo "  SOURCE (local): $(mask_url "$SOURCE_URL")"
echo "  TARGET (prod):  $(mask_url "$TARGET_URL")"
if [[ "$PG_DUMP_MODE" == docker:* ]]; then
  echo "  pg_dump via:    Docker container '${PG_DUMP_MODE#docker:}'"
else
  echo "  pg_dump via:    local binary"
fi
echo "  ================================================="
echo ""
echo "  WARNING: This will DROP and RECREATE all objects in"
echo "  the production database and overwrite all data."
echo "  This action cannot be undone."
echo ""
printf "  Type 'yes' to continue: "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo ""
  echo "  Aborted."
  exit 0
fi

DUMP_FILE="$(mktemp /tmp/db-clone-XXXXXX.sql)"
# Reason: trap ensures the temp file is removed even if the script errors out
trap 'rm -f "$DUMP_FILE"' EXIT

# ---------------------------------------------------------------------------
# Dump
# ---------------------------------------------------------------------------
echo ""
echo "[1/2] Dumping local database..."
if [[ "$PG_DUMP_MODE" == docker:* ]]; then
  CONTAINER="${PG_DUMP_MODE#docker:}"
  docker exec "$CONTAINER" pg_dump \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    -d "$SOURCE_URL" > "$DUMP_FILE"
else
  pg_dump \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    -d "$SOURCE_URL" \
    -f "$DUMP_FILE"
fi

# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------
echo "[2/2] Restoring to production database..."
psql \
  -d "$TARGET_URL" \
  -v ON_ERROR_STOP=1 \
  -f "$DUMP_FILE" \
  --quiet

echo ""
echo "  Done. Production database updated from local."
echo ""
