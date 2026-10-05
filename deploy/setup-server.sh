#!/bin/bash
# One-time setup of a fresh Ubuntu 24.04 server for The Seven Levels.
# Run as root on the server. Safe to run again.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq curl ca-certificates gnupg sqlite3 rsync ufw unattended-upgrades

# Node.js 24 (LTS) from NodeSource
if ! node --version 2>/dev/null | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -yq nodejs
fi

# cloudflared, from Cloudflare's package repository
if ! command -v cloudflared >/dev/null; then
  mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg -o /usr/share/keyrings/cloudflare-main.gpg
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' > /etc/apt/sources.list.d/cloudflared.list
  apt-get update -q && apt-get install -yq cloudflared
fi

# The app's own user and folders
id seven >/dev/null 2>&1 || useradd --system --create-home --home-dir /srv/seven-levels --shell /usr/sbin/nologin seven
mkdir -p /srv/seven-levels/app /srv/seven-levels/data /srv/seven-levels/backups
chown -R seven:seven /srv/seven-levels
chmod 750 /srv/seven-levels

# The owner's key (generated once, kept on the server)
if [ ! -f /srv/seven-levels/env ]; then
  echo "OWNER_KEY=$(openssl rand -hex 24)" > /srv/seven-levels/env
  chown root:seven /srv/seven-levels/env
  chmod 640 /srv/seven-levels/env
fi

# Firewall: only SSH in. Visitors arrive through the Cloudflare tunnel, which connects outward.
ufw allow OpenSSH
ufw --force enable

# SSH: keys only
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh || true

# Security updates install themselves
dpkg-reconfigure -f noninteractive unattended-upgrades

# Nightly database backup at 4:15 (server time)
echo '15 4 * * * seven /srv/seven-levels/app/deploy/backup.sh' > /etc/cron.d/seven-levels-backup

echo "Setup done."
