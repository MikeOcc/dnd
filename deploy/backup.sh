#!/bin/bash
# Nightly: a consistent copy of the game database, kept for 14 days.
# Run by cron as the seven user (see deploy/setup-server.sh).
set -euo pipefail
DIR=/srv/seven-levels/backups
mkdir -p "$DIR"
cd "$DIR"
sqlite3 /srv/seven-levels/data/seven-levels.db ".backup '$DIR/seven-levels-$(date +%F).db'"
gzip -f "$DIR/seven-levels-$(date +%F).db"
find "$DIR" -name 'seven-levels-*.db.gz' -mtime +14 -delete
