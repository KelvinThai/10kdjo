#!/usr/bin/env bash
# One-time production VM bootstrap.
#
# Run this once as the `dev` user on the target VM after a fresh
# clone of the repo to /opt/10kdjo. After it completes, all future
# deploys go through `scripts/deploy.sh` invoked by CI/CD.
#
# Pre-reqs before running:
#   - VM is Ubuntu 22.04+
#   - User running this has passwordless or password-prompt sudo
#   - DNS A records for 10kdojo.org and www.10kdojo.org point to this VM
#   - /opt/10kdjo/.env exists and is filled in (copy from .env.production.example)
#
# Usage:
#   sudo -i ./scripts/setup-production-server.sh
#
# The script is idempotent — re-running is safe.

set -euo pipefail

DEPLOY_DIR="/opt/10kdjo"
DEPLOY_USER="dev"
DOMAIN_PRIMARY="10kdojo.org"
DOMAIN_WWW="www.10kdojo.org"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-quan.thai1987@gmail.com}"

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "ERROR: must run as root (use sudo)." >&2
    exit 1
  fi
}

step() { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }

require_root

step "Checking we're inside the repo"
if [[ ! -f docker-compose.prod.yml ]]; then
  echo "Run this from $DEPLOY_DIR (where docker-compose.prod.yml lives)." >&2
  exit 1
fi

step "Checking .env"
if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy .env.production.example to .env and fill in values." >&2
  exit 1
fi

step "Updating apt and installing prerequisites"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y \
  ca-certificates curl gnupg lsb-release \
  software-properties-common \
  certbot python3-certbot-nginx \
  ufw

step "Installing Docker Engine + compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

step "Adding $DEPLOY_USER to docker group"
usermod -aG docker "$DEPLOY_USER"

step "Configuring UFW (22, 80, 443)"
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
yes | ufw enable >/dev/null || true

step "Stopping the default nginx site"
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm /etc/nginx/sites-enabled/default
fi

step "Writing webroot for ACME challenges"
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot

step "Installing 10kdojo.conf to nginx"
install -m 0644 deploy/nginx/10kdojo.conf /etc/nginx/sites-available/10kdojo.conf

# First run: a cert doesn't exist yet, so the :443 block in our config would
# crash nginx. Use a temporary HTTP-only stub until certbot generates the cert.
if [[ ! -f /etc/letsencrypt/live/${DOMAIN_PRIMARY}/fullchain.pem ]]; then
  step "No cert yet — writing temporary HTTP-only nginx config"
  cat > /etc/nginx/sites-enabled/10kdojo.conf <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_PRIMARY} ${DOMAIN_WWW};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "bootstrap"; }
}
NGINX

  nginx -t
  systemctl reload nginx

  step "Acquiring Let's Encrypt cert"
  certbot certonly \
    --webroot -w /var/www/certbot \
    -d "${DOMAIN_PRIMARY}" -d "${DOMAIN_WWW}" \
    --email "${LETSENCRYPT_EMAIL}" \
    --agree-tos --no-eff-email --non-interactive

  step "Swapping in the real nginx config (HTTP redirect + HTTPS proxy)"
  rm /etc/nginx/sites-enabled/10kdojo.conf
  ln -s /etc/nginx/sites-available/10kdojo.conf /etc/nginx/sites-enabled/10kdojo.conf
else
  step "Cert already exists — linking real nginx config"
  if [[ ! -L /etc/nginx/sites-enabled/10kdojo.conf ]]; then
    ln -sf /etc/nginx/sites-available/10kdojo.conf /etc/nginx/sites-enabled/10kdojo.conf
  fi
fi

nginx -t
systemctl reload nginx
systemctl enable --now nginx

step "Building and starting the docker compose stack"
# Switch to the deploy user for docker commands (they're in the docker group now)
sudo -u "$DEPLOY_USER" docker compose -f docker-compose.prod.yml build app migrate
sudo -u "$DEPLOY_USER" docker compose -f docker-compose.prod.yml up -d postgres
sudo -u "$DEPLOY_USER" docker compose -f docker-compose.prod.yml run --rm migrate
sudo -u "$DEPLOY_USER" docker compose -f docker-compose.prod.yml up -d app

step "Done."
echo "Visit https://${DOMAIN_PRIMARY} to verify."
echo "App logs: docker compose -f /opt/10kdjo/docker-compose.prod.yml logs -f app"
