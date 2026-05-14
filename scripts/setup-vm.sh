#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-vm.sh — One-time setup untuk VM Biznet GIO Cloud (Ubuntu 22.04 LTS)
#
# Jalankan SEKALI di VM baru:
#   chmod +x scripts/setup-vm.sh
#   sudo ./scripts/setup-vm.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:-}"   # Opsional: domain Anda, contoh: lms.contoh.id
REPO_URL="${2:-}" # Opsional: URL repo git, contoh: https://github.com/user/lms-inspira.git
APP_DIR="/opt/lms-inspira"

# ── Warna untuk output ────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Jalankan script ini sebagai root: sudo $0"

info "=== LMS Inspira — Setup VM Biznet GIO ==="
info "Ubuntu version: $(lsb_release -ds)"

# ── 1. Update sistem ──────────────────────────────────────────────────────────
info "1/7 Update sistem..."
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Install Docker ─────────────────────────────────────────────────────────
info "2/7 Install Docker..."
if command -v docker &>/dev/null; then
    warn "Docker sudah terinstall: $(docker --version)"
else
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    info "Docker installed: $(docker --version)"
fi

# ── 3. Install Nginx ──────────────────────────────────────────────────────────
info "3/7 Install Nginx..."
if command -v nginx &>/dev/null; then
    warn "Nginx sudah terinstall: $(nginx -v 2>&1)"
else
    apt-get install -y -qq nginx
    systemctl enable nginx
    systemctl start nginx
    info "Nginx installed: $(nginx -v 2>&1)"
fi

# ── 4. Install Certbot (Let's Encrypt SSL) ────────────────────────────────────
info "4/7 Install Certbot..."
if command -v certbot &>/dev/null; then
    warn "Certbot sudah terinstall: $(certbot --version)"
else
    apt-get install -y -qq certbot python3-certbot-nginx
    info "Certbot installed: $(certbot --version)"
fi

# ── 5. Install utilitas tambahan ──────────────────────────────────────────────
info "5/7 Install utilitas (git, ufw, fail2ban)..."
apt-get install -y -qq git ufw fail2ban

# Konfigurasi firewall dasar
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (untuk certbot + redirect)
ufw allow 443/tcp   # HTTPS
ufw --force enable
info "UFW firewall dikonfigurasi (allow 22, 80, 443)"

# ── 6. Clone/setup repo ───────────────────────────────────────────────────────
info "6/7 Setup direktori aplikasi..."
mkdir -p "$APP_DIR"

if [[ -n "$REPO_URL" ]]; then
    if [[ -d "$APP_DIR/.git" ]]; then
        warn "Repo sudah ada di $APP_DIR, skip clone"
    else
        git clone "$REPO_URL" "$APP_DIR"
        info "Repo di-clone ke $APP_DIR"
    fi
else
    warn "REPO_URL tidak diberikan. Clone manual: git clone <url> $APP_DIR"
fi

# ── 7. Konfigurasi Nginx ──────────────────────────────────────────────────────
info "7/7 Konfigurasi Nginx..."

if [[ -n "$DOMAIN" ]]; then
    # Salin nginx.conf dari repo dan ganti DOMAIN_PLACEHOLDER
    if [[ -f "$APP_DIR/nginx/nginx.conf" ]]; then
        sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$APP_DIR/nginx/nginx.conf" \
            > /etc/nginx/sites-available/lms-inspira
        ln -sf /etc/nginx/sites-available/lms-inspira /etc/nginx/sites-enabled/lms-inspira
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl reload nginx
        info "Nginx dikonfigurasi untuk domain: $DOMAIN"

        # Setup SSL dengan Certbot
        info "Setup SSL Let's Encrypt untuk $DOMAIN..."
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
            --email "admin@$DOMAIN" --redirect
        info "SSL berhasil dipasang!"
    else
        warn "File nginx/nginx.conf tidak ditemukan di repo. Setup Nginx manual."
    fi
else
    warn "DOMAIN tidak diberikan. Setup Nginx & SSL manual setelah clone repo."
    warn "Jalankan: sudo $0 <domain> [repo_url]"
fi

# ── Selesai ───────────────────────────────────────────────────────────────────
echo ""
info "=== Setup VM selesai! ==="
echo ""
echo "Langkah selanjutnya:"
echo "  1. Masuk ke direktori app:   cd $APP_DIR"
echo "  2. Salin env template:       cp .env.biznet.example .env.production"
echo "  3. Isi konfigurasi:          nano .env.production"
echo "  4. Build & jalankan:         ./deploy-biznet.sh"
echo ""
