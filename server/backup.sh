#!/bin/bash
# PostgreSQL Database Backup Script
# Usage: ./backup.sh [output-dir]
# Default: creates timestamped backup in ./backups/
# Requires: pg_dump (PostgreSQL client tools)

set -euo pipefail

OUTPUT_DIR="${1:-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/billxpress_${TIMESTAMP}.sql"

mkdir -p "$OUTPUT_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

pg_dump "${DATABASE_URL}" > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

echo "Backup created: ${BACKUP_FILE}.gz"
echo "Size: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"

# Keep only last 7 backups
ls -t "${OUTPUT_DIR}"/billxpress_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "Pruned old backups (kept last 7)"
