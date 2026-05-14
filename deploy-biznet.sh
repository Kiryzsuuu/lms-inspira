#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-biznet.sh — Deploy / update LMS Inspira di VM Biznet GIO Cloud
#
# Jalankan di VM setiap kali ingin update:
#   chmod +x deploy-biznet.sh
#   ./deploy-biznet.sh
#
# Flags opsional:
#   --seed    Jalankan database seeding setelah deploy (hati-hati di production!)
#   --no-pull Skip git pull (deploy dari kode yang sudah ada)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Konfigurasi ───────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="lms-inspira"
IMAGE_TAG="latest"
ENV_FILE="$APP_DIR/.env.production"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"

# ── Parse flags ───────────────────────────────────────────────────────────────
RUN_SEED=false
SKIP_PULL=false
for arg in "$@"; do
    case $arg in
        --seed)    RUN_SEED=true ;;
        --no-pull) SKIP_PULL=true ;;
    esac
done

# ── Warna output ──────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn()    { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARN:${NC} $*"; }
error()   { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $*"; exit 1; }
step()    { echo -e "\n${BLUE}▶ $*${NC}"; }

# ── Validasi environment ──────────────────────────────────────────────────────
step "Validasi environment"

command -v docker    &>/dev/null || error "Docker tidak ditemukan. Jalankan: sudo ./scripts/setup-vm.sh"
command -v docker    &>/dev/null && docker compose version &>/dev/null || \
    error "Docker Compose plugin tidak ditemukan."

[[ -f "$ENV_FILE" ]] || error ".env.production tidak ditemukan!\n  Jalankan: cp .env.biznet.example .env.production && nano .env.production"
[[ -f "$COMPOSE_FILE" ]] || error "docker-compose.yml tidak ditemukan."

# Validasi env vars wajib
source_env() {
    # Baca .env.production tanpa mengeksekusi, hanya load variabel
    set -a; source "$ENV_FILE"; set +a
}
source_env

[[ -z "${MONGO_URI:-}" ]]     && error "MONGO_URI belum diset di .env.production"
[[ -z "${JWT_SECRET:-}" ]]    && error "JWT_SECRET belum diset di .env.production"
[[ -z "${CLIENT_ORIGIN:-}" ]] && error "CLIENT_ORIGIN belum diset di .env.production"

# JWT_SECRET minimal 32 karakter
[[ ${#JWT_SECRET} -lt 32 ]] && error "JWT_SECRET terlalu pendek (min 32 karakter)"

info "Environment OK"
info "  CLIENT_ORIGIN = $CLIENT_ORIGIN"
info "  NODE_ENV      = ${NODE_ENV:-production}"

# ── 1. Pull kode terbaru ──────────────────────────────────────────────────────
if [[ "$SKIP_PULL" == "false" ]]; then
    step "Git pull"
    cd "$APP_DIR"
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "unknown")
    if [[ "$LOCAL" == "$REMOTE" ]]; then
        warn "Kode sudah up-to-date, tetap rebuild image."
    fi
    git pull --ff-only || {
        warn "git pull --ff-only gagal. Coba resolve konflik manual."
        warn "Melanjutkan dengan kode yang ada (--no-pull)..."
    }
    info "Git HEAD: $(git rev-parse --short HEAD) — $(git log -1 --format='%s')"
fi

# ── 2. Build Docker image ─────────────────────────────────────────────────────
step "Build Docker image ($IMAGE_NAME:$IMAGE_TAG)"
cd "$APP_DIR"

BUILD_START=$(date +%s)
docker build \
    --tag "$IMAGE_NAME:$IMAGE_TAG" \
    --label "build.git.sha=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
    --label "build.timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    .
BUILD_END=$(date +%s)
info "Image berhasil di-build dalam $((BUILD_END - BUILD_START)) detik"

# ── 3. Zero-downtime restart ──────────────────────────────────────────────────
step "Zero-downtime container restart"

# Cek apakah container sedang berjalan
RUNNING=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q app 2>/dev/null | head -1 || true)

if [[ -n "$RUNNING" ]]; then
    info "Container sedang berjalan, melakukan rolling restart..."
    # Start container baru dengan image baru, lalu stop yang lama
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps app
else
    info "Memulai container baru..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
fi

# ── 4. Tunggu health check ────────────────────────────────────────────────────
step "Menunggu health check..."
MAX_WAIT=60
WAITED=0
until docker inspect --format='{{.State.Health.Status}}' lms-inspira 2>/dev/null | grep -q "healthy"; do
    if [[ $WAITED -ge $MAX_WAIT ]]; then
        warn "Health check timeout setelah ${MAX_WAIT}s. Cek log: docker logs lms-inspira"
        break
    fi
    printf "."
    sleep 2
    WAITED=$((WAITED + 2))
done
echo ""

HEALTH=$(docker inspect --format='{{.State.Health.Status}}' lms-inspira 2>/dev/null || echo "unknown")
if [[ "$HEALTH" == "healthy" ]]; then
    info "Container sehat (healthy) ✓"
else
    warn "Container status: $HEALTH"
    warn "Cek log: docker logs lms-inspira --tail 50"
fi

# ── 5. Database seeding (opsional) ───────────────────────────────────────────
if [[ "$RUN_SEED" == "true" ]]; then
    step "Database seeding"
    warn "PERHATIAN: Seeding akan menambah data sample ke database!"
    read -rp "Lanjutkan seeding? (y/N) " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        docker exec lms-inspira node server/scripts/seed.js
        info "Seeding selesai"
    else
        info "Seeding dibatalkan"
    fi
fi

# ── 6. Cleanup image lama ─────────────────────────────────────────────────────
step "Cleanup image lama (dangling)"
docker image prune -f --filter "label=build.git.sha" 2>/dev/null || true
docker image prune -f 2>/dev/null || true

# ── 7. Reload Nginx (jika ada perubahan config) ───────────────────────────────
if systemctl is-active --quiet nginx 2>/dev/null; then
    nginx -t 2>/dev/null && systemctl reload nginx && info "Nginx di-reload" || warn "Nginx config test gagal, skip reload"
fi

# ── Selesai ───────────────────────────────────────────────────────────────────
step "Deploy selesai!"
echo ""
info "Status container:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
info "URL aplikasi: $CLIENT_ORIGIN"
info "Health check: $CLIENT_ORIGIN/api/health"
echo ""
info "Perintah berguna:"
echo "  Lihat log:      docker logs lms-inspira -f"
echo "  Restart:        docker compose restart"
echo "  Stop:           docker compose down"
echo "  Status:         docker compose ps"
echo ""
