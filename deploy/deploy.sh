#!/bin/bash
# Deploys the current code to the server and restarts the game.
# Run on the Mac, from the project folder:  ./deploy/deploy.sh
# (Live games in memory are lost on restart; saved games are untouched.)
set -euo pipefail
SERVER=root@5.161.241.215
cd "$(dirname "$0")/.."

npm run typecheck
rsync -az --delete \
  --exclude node_modules --exclude '*.db' --exclude '*.db-*' --exclude scratch --exclude mikefiles \
  --exclude .git --exclude .DS_Store --exclude dist \
  ./ "$SERVER:/srv/seven-levels/app/"
ssh "$SERVER" 'set -e
  chown -R seven:seven /srv/seven-levels/app
  cd /srv/seven-levels/app && sudo -u seven npm ci --no-audit --no-fund --loglevel=error
  install -m 644 deploy/seven-levels.service /etc/systemd/system/seven-levels.service
  chmod +x deploy/backup.sh
  systemctl daemon-reload
  systemctl enable --now seven-levels >/dev/null 2>&1 || true
  systemctl restart seven-levels
  sleep 3
  systemctl is-active seven-levels
  curl -s -o /dev/null -w "game server answers: %{http_code}\n" http://127.0.0.1:3000/'
