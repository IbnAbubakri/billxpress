#!/bin/bash
# SQLite Database Backup Script
# Usage: ./backup.sh [output-dir]
# Default: creates timestamped backup in ./backups/

set -euo pipefail

DB_PATH="data/billxpress.db"
OUTPUT_DIR="${1:-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/billxpress_${TIMESTAMP}.db"

mkdir -p "$OUTPUT_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found at $DB_PATH"
  exit 1
fi

sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
gzip "$BACKUP_FILE"

echo "Backup created: ${BACKUP_FILE}.gz"
echo "Size: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"

# Keep only last 7 backups
ls -t "${OUTPUT_DIR}"/billxpress_*.db.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "Pruned old backups (kept last 7)"
