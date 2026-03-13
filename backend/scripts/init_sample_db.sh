#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_PATH="$ROOT_DIR/data/tasks.db"
SCHEMA_SQL="$ROOT_DIR/backend/src/main/resources/schema.sql"
SAMPLE_SQL="$ROOT_DIR/backend/src/main/resources/sample-data-en.sql"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "[ERROR] sqlite3 is not installed."
  echo "Install sqlite3 first, then re-run this script."
  exit 1
fi

mkdir -p "$ROOT_DIR/data"
rm -f "$DB_PATH"

sqlite3 "$DB_PATH" < "$SCHEMA_SQL"
sqlite3 "$DB_PATH" < "$SAMPLE_SQL"

echo "[OK] Sample database created: $DB_PATH"
echo "[OK] Seed source: $SAMPLE_SQL"
