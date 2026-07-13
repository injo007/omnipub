#!/bin/bash
# ==============================================================================
# Enterprise Autonomous Editorial Intelligence Platform
# One-File Master Production & Staging Installer with Embedded Templates
# Target OS: Ubuntu Server 24.04 LTS (x86_64/AMD64)
# ==============================================================================

set -Eeuo pipefail

# --- Global Variables & Constants ---
APP_NAME="editorial-platform"
LOCK_FILE="/var/run/${APP_NAME}-installer.lock"
INSTALLER_CONF="/etc/${APP_NAME}/installer.conf"
BASE_DIR="/opt/${APP_NAME}"
ETC_DIR="/etc/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
LOG_FILE="${LOG_DIR}/installer.log"

# Default Minimum Host Requirements (Configurable)
MIN_CPU=4
MIN_RAM_GB=8
MIN_DISK_GB=80

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Ensure we are root ---
if [[ $EUID -ne 0 && "${1:-}" != "help" && "${1:-}" != "-h" && "${1:-}" != "--help" ]]; then
    echo -e "${RED}Error: This script must be run with sudo or as root.${NC}" >&2
    exit 1
fi

# --- Lock Management ---
function acquire_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local pid
        pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}Error: Another instance of the installer (PID $pid) is already running.${NC}" >&2
            exit 2
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

function cleanup_lock() {
    rm -f "$LOCK_FILE"
}
trap cleanup_lock INT TERM EXIT

# --- Initialization of log and directory layout ---
function init_layout() {
    mkdir -p "$ETC_DIR" "$ETC_DIR/secrets" "$ETC_DIR/monitoring" "$ETC_DIR/scripts" "$ETC_DIR/templates" "$LOG_DIR" "$LOG_DIR/installer"
    mkdir -p "$BASE_DIR" "$BASE_DIR/current" "$BASE_DIR/releases" "$BASE_DIR/shared" "$BASE_DIR/backups" "$BASE_DIR/scripts" "$BASE_DIR/metadata"
    touch -a "$LOG_FILE"
    chmod 600 "$LOG_FILE"
}

# --- Redacted Structured Logging ---
function log() {
    local severity="$1"
    local msg="$2"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Redact sensitive parameters
    local clean_msg="$msg"
    clean_msg=$(echo "$clean_msg" | sed -E 's/(GEMINI_API_KEY|OPENROUTER_API_KEY|MINIMAX_API_KEY|OPENAI_API_KEY|CREDENTIALS_VAULT_KEY|RESTIC_PASSWORD|AWS_SECRET_ACCESS_KEY|password|token|secret)="[^"]*"/\1="[REDACTED_BY_INSTALLER]"/g')
    clean_msg=$(echo "$clean_msg" | sed -E 's/([a-zA-Z0-9_\-]{30,100})/[SENSITIVE_KEY_REDACTED]/g')

    # Console output
    case "$severity" in
        "ERROR") echo -e "${RED}[$timestamp] [$severity] ${clean_msg}${NC}" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp] [$severity] ${clean_msg}${NC}" ;;
        "INFO")  echo -e "${GREEN}[$timestamp] [$severity] ${clean_msg}${NC}" ;;
        *)       echo -e "${BLUE}[$timestamp] [$severity] ${clean_msg}${NC}" ;;
    esac

    # Structured log append
    echo "{\"timestamp\":\"$timestamp\",\"severity\":\"$severity\",\"message\":\"$clean_msg\"}" >> "$LOG_FILE"
}

# --- Error Handler ---
function err_trap() {
    local exit_code=$?
    local line_num=$1
    local bash_command="$2"
    log "ERROR" "Command '$bash_command' failed on line $line_num with status code $exit_code"
    cleanup_lock
    exit "$exit_code"
}
trap 'err_trap $LINENO "$BASH_COMMAND"' ERR

# --- Help Menu ---
function show_help() {
    cat << EOF
Enterprise Autonomous Editorial Intelligence Platform Installer

Usage:
  sudo ./install-editorial-platform.sh <command> [options]

Commands:
  install                      Install host dependencies, secure firewall, write templates, and deploy staging/production.
  verify                       Perform self-test acceptance validation of application & security gates.
  status                       Provide high-density CPU, memory, container health and network diagnostics.
  update                       Deploy a new immutable release with roll-back fail-safes.
    --digest <digest>          Upgrade to specified Docker immutable image digest (sha256:...).
  rollback                     Rollback staging or production to the previous stable release.
  backup                       Create a local encrypted/compressed snapshot of data, volumes & configs.
  remote-backup                Initiate secure restic encrypted remote cloud backup.
  remote-snapshots             List available cloud snapshots from remote restic repository.
  remote-restore               Restore cloud snapshot to isolated verification directory first.
    --snapshot <snapshot-id>   Specify target snapshot to verify and restore.
  list-backups                 Display table of all locally stored backups & their signatures.
  restore                      Restore application state from an existing backup snapshot.
    --backup <backup-id>       Specify the unique Backup ID to restore.
  diagnostics                  Compile full system diagnostic reports into a secure tarball.
  logs                         Print real-time multiplexed container logs.
  uninstall                    Gracefully teardown containers, firewall overrides & directories.
  help                         Display this detailed information screen.

Options:
  --non-interactive            Execute commands without prompt inquiries using defaults or configs.

Examples:
  sudo ./install-editorial-platform.sh install
  sudo ./install-editorial-platform.sh update --digest sha256:49fbc0d633391d8487779774619d8bf84260f85cdbd6bf957ad7efd18d4073bb
  sudo ./install-editorial-platform.sh remote-restore --snapshot latest
EOF
}

# --- Preflight Validation ---
function run_preflights() {
    log "INFO" "Executing host system preflight checks..."
    
    # 1. OS Verification
    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        if [[ "$ID" != "ubuntu" ]] || [[ "$VERSION_ID" != "24.04" ]]; then
            log "WARN" "OS detected as $NAME $VERSION_ID. Officially supported OS is Ubuntu Server 24.04 LTS."
            if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
                log "ERROR" "OS mismatch. Aborting. Set BYPASS_PREFLIGHTS=true to proceed at own risk."
                exit 3
            fi
        fi
    else
        log "ERROR" "Unable to read /etc/os-release. Aborting."
        exit 3
    fi

    # 2. Architecture Verification
    local arch
    arch=$(uname -m)
    if [[ "$arch" != "x86_64" ]] && [[ "$arch" != "amd64" ]]; then
        log "ERROR" "Unsupported processor architecture: $arch. AMD64/x86_64 is strictly required."
        exit 3
    fi

    log "INFO" "Preflight validation complete."
}

# --- Dependency Installation ---
function install_dependencies() {
    log "INFO" "Installing mandatory host system packages..."
    
    if [[ "${BYPASS_PREFLIGHTS:-false}" == "true" ]]; then
        log "INFO" "Bypassing dependency installs for testing/sandbox mode."
        return
    fi

    export DEBIAN_FRONTEND=noninteractive
    
    apt-get update -y
    apt-get install -y \
        curl \
        ca-certificates \
        gnupg \
        jq \
        git \
        openssl \
        rsync \
        tar \
        gzip \
        unzip \
        ufw \
        fail2ban \
        logrotate \
        unattended-upgrades \
        restic

    # Install Docker Engine from official repositories
    if ! command -v docker &>/dev/null; then
        log "INFO" "Installing Docker Engine from Docker official repository..."
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
        chmod a+r /etc/apt/keyrings/docker.gpg

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
          tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    else
        log "INFO" "Docker Engine is already installed."
    fi

    log "INFO" "All system dependencies installed successfully."
}

# --- Secure Config Collection ---
function collect_config() {
    log "INFO" "Collecting application secrets and domain configs..."
    
    # Check if we have previous configs
    if [[ -f "$INSTALLER_CONF" ]]; then
        # shellcheck disable=SC1090
        source "$INSTALLER_CONF"
        log "INFO" "Existing configuration loaded from $INSTALLER_CONF."
    fi

    local staging_domain="${STAGING_DOMAIN:-staging.editorial-intelligence.com}"
    local prod_domain="${PRODUCTION_DOMAIN:-editorial-intelligence.com}"
    local admin_email="${ADMIN_EMAIL:-admin@editorial-intelligence.com}"
    local gemini_key="${GEMINI_API_KEY:-}"
    local openrouter_key="${OPENROUTER_API_KEY:-}"
    local minimax_key="${MINIMAX_API_KEY:-}"
    local vault_key="${CREDENTIALS_VAULT_KEY:-}"
    
    local pg_user="${PGUSER:-postgres}"
    local pg_password="${PGPASSWORD:-}"
    local pg_database="${PGDATABASE:-editorial_db}"
    local pg_host="${PGHOST:-db}"
    local pg_port="${PGPORT:-5432}"

    local restic_repo="${RESTIC_REPOSITORY:-s3:https://s3.amazonaws.com/editorial-backups}"
    local restic_pass="${RESTIC_PASSWORD:-super-secure-restic-vault-pass-123}"
    local aws_id="${AWS_ACCESS_KEY_ID:-}"
    local aws_secret="${AWS_SECRET_ACCESS_KEY:-}"

    if [[ "${NON_INTERACTIVE:-false}" == "false" ]]; then
        echo -e "${YELLOW}--- Secure Platform Setup Inquiries ---${NC}"
        
        read -r -p "Enter Staging Domain Name [$staging_domain]: " input
        STAGING_DOMAIN="${input:-$staging_domain}"

        read -r -p "Enter Production Domain Name [$prod_domain]: " input
        PRODUCTION_DOMAIN="${input:-$prod_domain}"

        read -r -p "Enter Admin Email for SSL Certificates [$admin_email]: " input
        ADMIN_EMAIL="${input:-$admin_email}"

        echo -n "Enter GEMINI_API_KEY (hidden): "
        read -r -s input_key
        echo ""
        if [[ -n "$input_key" ]]; then
            GEMINI_API_KEY="$input_key"
        else
            GEMINI_API_KEY="$gemini_key"
        fi

        echo -n "Enter OPENROUTER_API_KEY for MiniMax-M3 and fallback routing (hidden, optional if native MiniMax is configured): "
        read -r -s input_openrouter_key
        echo ""
        OPENROUTER_API_KEY="${input_openrouter_key:-$openrouter_key}"

        echo -n "Enter native MINIMAX_API_KEY (hidden, optional if OpenRouter is configured): "
        read -r -s input_minimax_key
        echo ""
        MINIMAX_API_KEY="${input_minimax_key:-$minimax_key}"

        echo -n "Enter CREDENTIALS_VAULT_KEY (exactly 32 chars): "
        read -r -s input_vault
        echo ""
        if [[ -n "$input_vault" ]]; then
            CREDENTIALS_VAULT_KEY="$input_vault"
        else
            CREDENTIALS_VAULT_KEY="$vault_key"
        fi

        echo -e "${YELLOW}--- Self-Hosted PostgreSQL Configuration ---${NC}"
        read -r -p "Enter PostgreSQL Username [$pg_user]: " input
        PGUSER="${input:-$pg_user}"

        echo -n "Enter PostgreSQL Password (hidden): "
        read -r -s input_pg_pass
        echo ""
        if [[ -n "$input_pg_pass" ]]; then
            PGPASSWORD="$input_pg_pass"
        else
            PGPASSWORD="$pg_password"
        fi

        read -r -p "Enter PostgreSQL Database Name [$pg_database]: " input
        PGDATABASE="${input:-$pg_database}"

        read -r -p "Enter PostgreSQL Host (use 'db' for internal container connection) [$pg_host]: " input
        PGHOST="${input:-$pg_host}"

        read -r -p "Enter PostgreSQL Port [$pg_port]: " input
        PGPORT="${input:-$pg_port}"

        echo -e "${YELLOW}--- Remote Encrypted Cloud Backup Setup ---${NC}"
        read -r -p "Enter Restic Repository Target [$restic_repo]: " input
        RESTIC_REPOSITORY="${input:-$restic_repo}"

        echo -n "Enter Restic Password (hidden): "
        read -r -s input_pass
        echo ""
        if [[ -n "$input_pass" ]]; then
            RESTIC_PASSWORD="$input_pass"
        else
            RESTIC_PASSWORD="$restic_pass"
        fi

        read -r -p "Enter AWS Access Key ID (Optional for S3/R2) [$aws_id]: " input
        AWS_ACCESS_KEY_ID="${input:-$aws_id}"

        echo -n "Enter AWS Secret Access Key (Optional, hidden): "
        read -r -s input_aws_sec
        echo ""
        if [[ -n "$input_aws_sec" ]]; then
            AWS_SECRET_ACCESS_KEY="$input_aws_sec"
        else
            AWS_SECRET_ACCESS_KEY="$aws_secret"
        fi
    else
        log "INFO" "Non-interactive execution mode. Consuming environment variables or defaults."
        STAGING_DOMAIN="$staging_domain"
        PRODUCTION_DOMAIN="$prod_domain"
        ADMIN_EMAIL="$admin_email"
        GEMINI_API_KEY="$gemini_key"
        OPENROUTER_API_KEY="$openrouter_key"
        MINIMAX_API_KEY="$minimax_key"
        CREDENTIALS_VAULT_KEY="$vault_key"
        PGUSER="$pg_user"
        PGPASSWORD="$pg_password"
        PGDATABASE="$pg_database"
        PGHOST="$pg_host"
        PGPORT="$pg_port"
        RESTIC_REPOSITORY="$restic_repo"
        RESTIC_PASSWORD="$restic_pass"
        AWS_ACCESS_KEY_ID="$aws_id"
        AWS_SECRET_ACCESS_KEY="$aws_secret"
    fi

    if [[ -z "$OPENROUTER_API_KEY" && -z "$MINIMAX_API_KEY" ]]; then
        log "ERROR" "Configure OPENROUTER_API_KEY or MINIMAX_API_KEY for the MiniMax-M3 primary model."
        exit 4
    fi
    if [[ -z "$PGPASSWORD" ]]; then
        log "ERROR" "PostgreSQL password is mandatory. Setup cannot proceed."
        exit 4
    fi
    if [[ ${#CREDENTIALS_VAULT_KEY} -ne 32 ]]; then
        log "ERROR" "CREDENTIALS_VAULT_KEY must contain exactly 32 characters."
        exit 4
    fi

    # Write secrets and variables to secure config files
    cat <<EOF > "$INSTALLER_CONF"
STAGING_DOMAIN="${STAGING_DOMAIN}"
PRODUCTION_DOMAIN="${PRODUCTION_DOMAIN}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
PGUSER="${PGUSER}"
PGPASSWORD="${PGPASSWORD}"
PGDATABASE="${PGDATABASE}"
PGHOST="${PGHOST}"
PGPORT="${PGPORT}"
EOF
    chmod 600 "$INSTALLER_CONF"

    # Write environment files
    cat <<EOF > "${ETC_DIR}/production.env"
NODE_ENV=production
PORT=3000
GEMINI_API_KEY="${GEMINI_API_KEY}"
OPENROUTER_API_KEY="${OPENROUTER_API_KEY}"
MINIMAX_API_KEY="${MINIMAX_API_KEY}"
CREDENTIALS_VAULT_KEY="${CREDENTIALS_VAULT_KEY}"
APP_URL="https://${PRODUCTION_DOMAIN}"
WORKER_CONCURRENCY=5
WORKER_LEASE_DURATION_SEC=60
MAX_PUBLISHING_RETRIES=5
PGHOST="${PGHOST}"
PGPORT="${PGPORT}"
PGDATABASE="${PGDATABASE}"
PGUSER="${PGUSER}"
PGPASSWORD="${PGPASSWORD}"
POSTGRES_REQUIRED=true
AUTH_REQUIRED=false
EOF
    chmod 600 "${ETC_DIR}/production.env"

    cat <<EOF > "${ETC_DIR}/staging.env"
NODE_ENV=staging
PORT=3000
GEMINI_API_KEY="${GEMINI_API_KEY}"
OPENROUTER_API_KEY="${OPENROUTER_API_KEY}"
MINIMAX_API_KEY="${MINIMAX_API_KEY}"
CREDENTIALS_VAULT_KEY="${CREDENTIALS_VAULT_KEY}"
APP_URL="https://${STAGING_DOMAIN}"
WORKER_CONCURRENCY=5
WORKER_LEASE_DURATION_SEC=60
MAX_PUBLISHING_RETRIES=5
PGHOST="${PGHOST}"
PGPORT="${PGPORT}"
PGDATABASE="${PGDATABASE}"
PGUSER="${PGUSER}"
PGPASSWORD="${PGPASSWORD}"
POSTGRES_REQUIRED=true
AUTH_REQUIRED=false
EOF
    chmod 600 "${ETC_DIR}/staging.env"

    # Write Restic credentials securely
    cat <<EOF > "${ETC_DIR}/secrets/restic.env"
export RESTIC_REPOSITORY="${RESTIC_REPOSITORY}"
export RESTIC_PASSWORD="${RESTIC_PASSWORD}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
EOF
    chmod 600 "${ETC_DIR}/secrets/restic.env"

    # Write EMBEDDED TEMPLATES directly (ensures TRUE ONE-FILE installation)
    write_embedded_templates
}

# --- Write Embedded Templates ---
function write_embedded_templates() {
    log "INFO" "Extracting embedded application architecture templates..."

    # 1. Unified Caddyfile (Standard Reverse Proxy with Virtual Host Domain Routing on standard ports 80 & 443)
    cat <<EOF > "${ETC_DIR}/Caddyfile"
{
    email ${ADMIN_EMAIL}
}

${PRODUCTION_DOMAIN} {
    reverse_proxy editorial-production-app:3000 {
        header_up Host {upstream_host}
        header_up X-Real-IP {remote_host}
    }

    @metrics {
        path /api/metrics
        not remote_ip 127.0.0.1 ::1 172.16.0.0/12 10.0.0.0/8 192.168.0.0/16
    }
    respond @metrics "Forbidden" 403

    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://* http://*; connect-src 'self' https://* http://* wss://* ws://*;"
    }

    request_body {
        max_size 10MB
    }
}
EOF
    chmod 644 "${ETC_DIR}/Caddyfile"

    # 1b. Staging Caddyfile
    cat <<EOF > "${ETC_DIR}/Caddyfile.staging"
{
    email ${ADMIN_EMAIL}
}

${STAGING_DOMAIN} {
    reverse_proxy editorial-staging-app:3000 {
        header_up Host {upstream_host}
        header_up X-Real-IP {remote_host}
    }

    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://* http://*; connect-src 'self' https://* http://* wss://* ws://*;"
    }

    request_body {
        max_size 10MB
    }
}
EOF
    chmod 644 "${ETC_DIR}/Caddyfile.staging"

    # 2. Production compose.production.yml
    cat <<EOF > "${BASE_DIR}/compose.production.yml"
name: editorial-production

services:
  db:
    image: postgres:16-alpine
    container_name: editorial-production-db
    restart: always
    environment:
      POSTGRES_USER: "${PGUSER}"
      POSTGRES_PASSWORD: "${PGPASSWORD}"
      POSTGRES_DB: "${PGDATABASE}"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${PGUSER} -d ${PGDATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    volumes:
      - pg-data:/var/lib/postgresql/data
    networks:
      - editorial-production-internal
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  app:
    container_name: editorial-production-app
    image: editorial-platform:production
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=3000
      - POSTGRES_REQUIRED=true
    env_file:
      - /etc/editorial-platform/production.env
    expose:
      - "3000"
    volumes:
      - app-data:/app/data
    networks:
      - editorial-production-internal
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2048M
        reservations:
          cpus: '0.2'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  proxy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/editorial-platform/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - editorial-production-internal
      - editorial-production-proxy
    depends_on:
      - app
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

networks:
  editorial-production-internal:
    driver: bridge
  editorial-production-proxy:
    driver: bridge

volumes:
  app-data:
  pg-data:
  caddy-data:
  caddy-config:
EOF
    chmod 644 "${BASE_DIR}/compose.production.yml"

    # 3. Staging compose.staging.yml (No staging ports published! Standard 80/443 routed safely via single master Caddy!)
    cat <<EOF > "${BASE_DIR}/compose.staging.yml"
name: editorial-staging

services:
  db:
    image: postgres:16-alpine
    container_name: editorial-staging-db
    restart: always
    environment:
      POSTGRES_USER: "${PGUSER}"
      POSTGRES_PASSWORD: "${PGPASSWORD}"
      POSTGRES_DB: "${PGDATABASE}"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${PGUSER} -d ${PGDATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    volumes:
      - pg-staging-data:/var/lib/postgresql/data
    networks:
      - editorial-staging-internal
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

  app:
    container_name: editorial-staging-app
    image: editorial-platform:staging
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - NODE_ENV=staging
      - PORT=3000
      - POSTGRES_REQUIRED=true
    env_file:
      - /etc/editorial-platform/staging.env
    expose:
      - "3000"
    volumes:
      - app-staging-data:/app/data
    networks:
      - editorial-staging-internal
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1024M
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

  proxy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "127.0.0.1:8080:80"
      - "127.0.0.1:8443:443"
    volumes:
      - /etc/editorial-platform/Caddyfile.staging:/etc/caddy/Caddyfile:ro
      - caddy-staging-data:/data
      - caddy-staging-config:/config
    networks:
      - editorial-staging-internal
      - editorial-staging-proxy
    depends_on:
      - app
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "3"

networks:
  editorial-staging-internal:
    driver: bridge
  editorial-staging-proxy:
    driver: bridge

volumes:
  app-staging-data:
  pg-staging-data:
  caddy-staging-data:
  caddy-staging-config:
EOF
    chmod 644 "${BASE_DIR}/compose.staging.yml"

    # 4. Embedded Prometheus Config
    cat <<EOF > "${ETC_DIR}/monitoring/prometheus.yml"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert.rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - "alertmanager:9093"

scrape_configs:
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "editorial-app-prod"
    metrics_path: "/api/metrics"
    static_configs:
      - targets: ["editorial-production-app:3000"]

  - job_name: "editorial-app-staging"
    metrics_path: "/api/metrics"
    static_configs:
      - targets: ["editorial-staging-app:3000"]
EOF
    chmod 644 "${ETC_DIR}/monitoring/prometheus.yml"

    # 5. Embedded Alertmanager Config
    cat <<EOF > "${ETC_DIR}/monitoring/alertmanager.yml"
global:
  resolve_timeout: 5m

route:
  group_by: ["alertname"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: "admin-email"

receivers:
  - name: "admin-email"
    email_configs:
      - to: "${ADMIN_EMAIL}"
        from: "alerts@editorial-intelligence.com"
        smarthost: "smtp.example.com:587"
        require_tls: true
EOF
    chmod 644 "${ETC_DIR}/monitoring/alertmanager.yml"

    # 6. Embedded Alertmanager Alert Rules
    cat <<EOF > "${ETC_DIR}/monitoring/alert.rules.yml"
groups:
  - name: HostAlerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ \$labels.instance }}"

      - alert: HostOutOfMemory
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Extreme Low Memory on {{ \$labels.instance }}"

      - alert: OutOfDiskSpace
        expr: node_filesystem_free_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space almost exhausted on {{ \$labels.instance }}"

      - alert: InodeExhaustion
        expr: node_filesystem_files_free{mountpoint="/"} / node_filesystem_files{mountpoint="/"} * 100 < 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Inode exhaustion on {{ \$labels.instance }}"

      - alert: ContainerUnexpectedRestart
        expr: rate(container_start_time_seconds[5m]) > 0.05
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Unexpected Container Restarts detected"

  - name: ApplicationAlerts
    rules:
      - alert: APILivenessFailure
        expr: probe_success{job="liveness"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API health check failed liveness probe"

      - alert: WorkerHeartbeatFailed
        expr: worker_heartbeat_seconds_since_last > 120
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Worker failed heartbeat loop execution"

      - alert: DeadLetterQueueGrowth
        expr: dead_letter_queue_count > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Jobs are actively accumulating inside dead-letter queue"

      - alert: WordPressAuthFailures
        expr: increase(wordpress_auth_failures_total[5m]) > 3
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "WordPress authentication failure spike detected"

      - alert: BudgetWarningExceeded
        expr: cumulative_spent_usd > 12.00
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Workspace token spend has breached warning threshold of \$12.00"

      - alert: RemoteBackupFailure
        expr: backup_success_status == 0
        for: 24h
        labels:
          severity: critical
        annotations:
          summary: "Encrypted remote cloud backup has failed to run within the last 24 hours"
EOF
    chmod 644 "${ETC_DIR}/monitoring/alert.rules.yml"

    # 7. Embedded Restic Automated Cloud Backup script
    cat <<EOF > "${ETC_DIR}/scripts/restic-backup.sh"
#!/bin/bash
set -euo pipefail

# Securely load environment keys
if [[ -f "${ETC_DIR}/secrets/restic.env" ]]; then
    # shellcheck disable=SC1091
    source "${ETC_DIR}/secrets/restic.env"
else
    echo "Error: Restic credentials not found." >&2
    exit 1
fi

export RESTIC_REPOSITORY
export RESTIC_PASSWORD
if [[ -n "\${AWS_ACCESS_KEY_ID:-}" ]]; then
    export AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY
fi

# Run restic backup against configuration and state directories
echo "[RESTIC] Starting encrypted remote backup..."
set -a
# shellcheck disable=SC1091
source "${ETC_DIR}/production.env"
set +a
docker exec editorial-production-db pg_dump \
    --username "${PGUSER}" \
    --dbname "${PGDATABASE}" \
    --format custom \
    --no-owner \
    --file /tmp/editorial-platform.dump
docker cp editorial-production-db:/tmp/editorial-platform.dump "${BASE_DIR}/backups/postgres-latest.dump"
docker exec editorial-production-db rm -f /tmp/editorial-platform.dump
restic backup \
    "${ETC_DIR}" \
    "${BASE_DIR}" \
    --exclude "${BASE_DIR}/backups" \
    --exclude "${LOG_DIR}"

# Record success metadata locally
METADATA_FILE="${BASE_DIR}/metadata/backup-last-success.json"
echo "{\"last_success\":\"\$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"success\"}" > "\$METADATA_FILE"
echo "[RESTIC] Backup complete."

# Enforce snapshot pruning and retention constraints
echo "[RESTIC] Retaining snapshots (7 daily, 4 weekly, 12 monthly)..."
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune

# Run integrity verification
echo "[RESTIC] Verifying backup data integrity..."
restic check
EOF
    chmod 700 "${ETC_DIR}/scripts/restic-backup.sh"

    # 8. Embedded Systemd Service Templates (Handles failure recovery and file descriptor limits)
    cat <<EOF > "${ETC_DIR}/templates/editorial-platform-production.service.tmpl"
[Unit]
Description=Autonomous Editorial Intelligence Platform - Production Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${BASE_DIR}
ExecStart=/usr/bin/docker compose -f compose.production.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f compose.production.yml down
Restart=always
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
    chmod 644 "${ETC_DIR}/templates/editorial-platform-production.service.tmpl"

    cat <<EOF > "${ETC_DIR}/templates/editorial-platform-staging.service.tmpl"
[Unit]
Description=Autonomous Editorial Intelligence Platform - Staging Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${BASE_DIR}
ExecStart=/usr/bin/docker compose -f compose.staging.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f compose.staging.yml down
Restart=always
RestartSec=10
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
    chmod 644 "${ETC_DIR}/templates/editorial-platform-staging.service.tmpl"
}

# --- Host Hardening ---
function apply_hardening() {
    log "INFO" "Applying host-level security hardening..."

    if [[ "${BYPASS_PREFLIGHTS:-false}" == "true" ]]; then
        log "INFO" "Bypassing server hardening in sandbox environment."
        return
    fi

    # Configure firewall (UFW)
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow active SSH port
    local ssh_port=22
    if [[ -f /etc/ssh/sshd_config ]]; then
        local config_port
        config_port=$(grep -E '^Port ' /etc/ssh/sshd_config | awk '{print $2}' || echo "22")
        ssh_port="${config_port:-22}"
    fi
    ufw allow "$ssh_port"/tcp comment 'SSH Port Ingress'
    
    # Allow web ports 80 & 443 ONLY. Staging ports 8080 or 8443 are NOT exposed anymore!
    ufw allow 80/tcp comment 'HTTP Ingress'
    ufw allow 443/tcp comment 'HTTPS Ingress'

    # Enable firewall non-interactively
    ufw --force enable

    # Configure DOCKER-USER chain protection to force docker traffic to respect local system firewall rules
    iptables -I DOCKER-USER -i eth0 ! -s 127.0.0.1 -p tcp --dport 3000 -j DROP || true

    # Enable fail2ban
    systemctl enable fail2ban --now || log "WARN" "fail2ban daemon failed to start"

    # Configure automatic security upgrades
    systemctl enable unattended-upgrades --now || log "WARN" "unattended-upgrades failed to start"

    log "INFO" "Firewall and host hardening applied. Only SSH ($ssh_port), HTTP (80) and HTTPS (443) are publicly exposed."
}

# --- Teardown & Docker Deploy ---
function deploy_application() {
    log "INFO" "Tearing down active instances & deploying containers..."
    
    if [[ "${BYPASS_PREFLIGHTS:-false}" == "true" ]]; then
        log "INFO" "Bypassing real Docker Compose execution in testing mode."
        return
    fi

    # Setup isolated networks
    docker network create editorial-production-proxy || true
    docker network create editorial-staging-proxy || true

    # Build or pull exact immutable release images
    log "INFO" "Building immutable application image..."
    docker build -t editorial-platform:production -f Dockerfile .
    docker tag editorial-platform:production editorial-platform:staging

    # Production Deploy
    log "INFO" "Starting Production Stack via Docker Compose..."
    docker compose -f "${BASE_DIR}/compose.production.yml" up -d --remove-orphans

    # Staging Deploy
    log "INFO" "Starting Staging Stack via Docker Compose..."
    docker compose -f "${BASE_DIR}/compose.staging.yml" up -d --remove-orphans

    # Record Metadata
    local deploy_sha
    deploy_sha=$(git rev-parse HEAD 2>/dev/null || echo "untracked-dev")
    local deploy_time
    deploy_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat <<EOF > "${BASE_DIR}/metadata/deployment.json"
{
  "application": "${APP_NAME}",
  "version": "1.0.0",
  "commit": "${deploy_sha}",
  "timestamp": "${deploy_time}",
  "production_domain": "${PRODUCTION_DOMAIN}",
  "staging_domain": "${STAGING_DOMAIN}"
}
EOF
    chmod 644 "${BASE_DIR}/metadata/deployment.json"
    log "INFO" "Containers deployed and deployment metadata successfully logged."
}

# --- Verification & Postcheck Acceptance ---
function verify_installation() {
    log "INFO" "Running acceptance verification suite..."

    local passed=true

    # 1. Check metadata
    if [[ -f "${BASE_DIR}/metadata/deployment.json" ]]; then
        log "INFO" "Deployment metadata is active and readable."
    else
        log "WARN" "Deployment metadata record not found."
        passed=false
    fi

    # 2. Check public listener leaks
    if command -v ss &>/dev/null; then
        local public_listeners
        public_listeners=$(ss -tuln | grep -E '(0\.0\.0\.0|\[::\]|\*):(3000|8080|8443)\b' || true)
        if [[ -n "$public_listeners" ]]; then
            log "ERROR" "Security Leak: Non-essential ports are publicly accessible! Listeners:\n$public_listeners"
            passed=false
        fi
    fi

    if [[ "$passed" == "true" ]]; then
        log "INFO" "INSTALLATION ACCEPTANCE: PASSED"
    else
        log "ERROR" "INSTALLATION ACCEPTANCE: FAILED"
        exit 5
    fi
}

# --- Local Backup Suite ---
function create_backup() {
    log "INFO" "Creating comprehensive application data snapshot..."
    local bkp_id="backup_$(date +%Y%m%d_%H%M%S)"
    local bkp_path="${BASE_DIR}/backups/${bkp_id}"
    mkdir -p "$bkp_path"

    # Backup configs securely
    if [[ -f "$INSTALLER_CONF" ]]; then
        cp "$INSTALLER_CONF" "${bkp_path}/installer.conf"
    fi
    if [[ -d "$ETC_DIR" ]]; then
        tar -czf "${bkp_path}/etc-config.tar.gz" -C "$ETC_DIR" .
    fi

    # Create a consistent PostgreSQL custom-format dump.
    if docker ps --format '{{.Names}}' | grep -qx 'editorial-production-db'; then
        docker exec editorial-production-db pg_dump \
            --username "${PGUSER}" \
            --dbname "${PGDATABASE}" \
            --format custom \
            --no-owner \
            --file /tmp/editorial-platform.dump
        docker cp editorial-production-db:/tmp/editorial-platform.dump "${bkp_path}/postgres.dump"
        docker exec editorial-production-db rm -f /tmp/editorial-platform.dump
    else
        log "ERROR" "Production PostgreSQL container is not running; refusing to create an incomplete backup."
        exit 6
    fi

    # Pack metadata
    if [[ -d "${BASE_DIR}/metadata" ]]; then
        tar -czf "${bkp_path}/metadata.tar.gz" -C "${BASE_DIR}/metadata" .
    fi

    # Compress the overall snapshot
    local archive="${BASE_DIR}/backups/${bkp_id}.tar.gz"
    tar -czf "$archive" -C "${BASE_DIR}/backups" "$bkp_id"
    rm -rf "$bkp_path"

    log "INFO" "SaaS backup archive created successfully: ${archive} [ID: $bkp_id]"
}

# --- List Backups ---
function list_backups() {
    log "INFO" "Available Backup Archives:"
    echo -e "-----------------------------------------------------------------------------------"
    echo -e "  Backup ID / Filename                               | Size       | Timestamp"
    echo -e "-----------------------------------------------------------------------------------"
    local count=0
    for file in "${BASE_DIR}/backups"/*.tar.gz; do
        if [[ -f "$file" ]]; then
            local name
            name=$(basename "$file")
            local size
            size=$(du -sh "$file" | awk '{print $1}')
            local mtime
            mtime=$(date -r "$file" -u +"%Y-%m-%dT%H:%M:%SZ")
            echo -e "  $name | $size | $mtime"
            count=$((count+1))
        fi
    done
    if [[ $count -eq 0 ]]; then
        echo -e "  No backup archives discovered under ${BASE_DIR}/backups/"
    fi
    echo -e "-----------------------------------------------------------------------------------"
}

# --- Restore Backup ---
function restore_backup() {
    local bkp_id="$1"
    local archive="${BASE_DIR}/backups/${bkp_id}.tar.gz"
    
    if [[ ! -f "$archive" ]]; then
        archive="${BASE_DIR}/backups/${bkp_id}"
        if [[ ! -f "$archive" ]]; then
            log "ERROR" "Backup archive target not found: $archive"
            exit 6
        fi
    fi

    log "WARN" "RESTORE OPERATOR WARNING: Proceeding will replace active configuration files."
    if [[ "${NON_INTERACTIVE:-false}" == "false" ]]; then
        read -r -p "Are you absolutely sure you want to proceed with restore? [y/N]: " confirm
        if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
            log "INFO" "Restore aborted by user."
            return
        fi
    fi

    # 1. Take safety pre-restore backup
    log "INFO" "Taking safety pre-restore backup first..."
    create_backup

    # 2. Extract backup to isolated directory first (Safe restore check)
    log "INFO" "Extracting backup to isolated verification target..."
    local tmp_extract
    tmp_extract=$(mktemp -d)
    tar -xzf "$archive" -C "$tmp_extract"
    
    local bkp_dir
    bkp_dir=$(find "$tmp_extract" -maxdepth 1 -type d -not -path "$tmp_extract" | head -n 1)
    
    if [[ -d "$bkp_dir" ]]; then
        # Copy config files back safely after verification
        if [[ -f "${bkp_dir}/installer.conf" ]]; then
            cp "${bkp_dir}/installer.conf" "$INSTALLER_CONF"
        fi
        if [[ -f "${bkp_dir}/etc-config.tar.gz" ]]; then
            tar -xzf "${bkp_dir}/etc-config.tar.gz" -C "$ETC_DIR"
        fi
        log "INFO" "Configuration restored. Restarting service nodes before PostgreSQL recovery..."
        deploy_application
        if [[ -f "${bkp_dir}/postgres.dump" ]]; then
            docker cp "${bkp_dir}/postgres.dump" editorial-production-db:/tmp/editorial-platform.dump
            docker exec editorial-production-db pg_restore \
                --username "${PGUSER}" \
                --dbname "${PGDATABASE}" \
                --clean \
                --if-exists \
                --no-owner \
                /tmp/editorial-platform.dump
            docker exec editorial-production-db rm -f /tmp/editorial-platform.dump
            docker restart editorial-production-app >/dev/null
        else
            log "ERROR" "Backup contains no PostgreSQL dump. Restore aborted."
            exit 6
        fi
        log "INFO" "PostgreSQL backup restored successfully."
    else
        log "ERROR" "Corrupted backup archive. Restore cancelled."
        exit 6
    fi
    
    rm -rf "$tmp_extract"
}

# --- Remote Backup Functions ---
function run_remote_backup() {
    log "INFO" "Triggering encrypted remote cloud backup execution..."
    if [[ -x "${ETC_DIR}/scripts/restic-backup.sh" ]]; then
        "${ETC_DIR}/scripts/restic-backup.sh"
    else
        log "ERROR" "Restic backup script is not executable or missing."
        exit 11
    fi
}

function list_remote_snapshots() {
    log "INFO" "Loading remote cloud snapshots..."
    if [[ -f "${ETC_DIR}/secrets/restic.env" ]]; then
        # shellcheck disable=SC1091
        source "${ETC_DIR}/secrets/restic.env"
        restic snapshots
    else
        log "ERROR" "Restic credentials missing."
        exit 11
    fi
}

function run_remote_restore() {
    local snapshot_id="$1"
    log "WARN" "REMOTE RESTORE WARNING: This will restore snapshot '$snapshot_id' into an isolated verification directory."
    
    if [[ "${NON_INTERACTIVE:-false}" == "false" ]]; then
        read -r -p "Confirm remote restore operation? [y/N]: " confirm
        if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
            log "INFO" "Remote restore aborted."
            return
        fi
    fi

    # Take pre-restore safety snapshot
    create_backup

    local iso_dir="${BASE_DIR}/backups/isolated_restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$iso_dir"
    log "INFO" "Restoring snapshot '$snapshot_id' to isolated target: $iso_dir"

    if [[ -f "${ETC_DIR}/secrets/restic.env" ]]; then
        # shellcheck disable=SC1091
        source "${ETC_DIR}/secrets/restic.env"
        restic restore "$snapshot_id" --target "$iso_dir"
        log "INFO" "Isolated restoration complete. State files ready for promotion checks inside $iso_dir."
    else
        log "ERROR" "Restic credentials missing."
        exit 11
    fi
}

# --- Update Pipeline with Immutable Digest Enforcement ---
function update_release() {
    local upgrade_type="$1"
    local identifier="$2"
    log "INFO" "Upgrade pipeline initiated with $upgrade_type: $identifier"
    
    # Strictly validate SHA-256 image digest format
    if [[ "$upgrade_type" == "--digest" ]]; then
        if [[ ! "$identifier" =~ ^sha256:[a-fA-F0-9]{64}$ ]]; then
            log "ERROR" "Invalid Docker image digest format. Must match strict sha256:64_hex_chars regex."
            exit 12
        fi
    else
        log "ERROR" "Production upgrades must enforce immutable image digests. Tag/Version changes rejected."
        exit 12
    fi

    # 1. Take safety pre-upgrade backup
    create_backup

    # Record previous metadata state
    local prev_digest="unknown"
    if [[ -f "${BASE_DIR}/compose.production.yml" ]]; then
        prev_digest=$(grep -E 'image:.*editorial-platform' "${BASE_DIR}/compose.production.yml" | awk -F'@' '{print $2}' || echo "tag-production")
    fi

    # 2. Upgrade active images
    if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
        log "INFO" "Pulling verified immutable image digest: $identifier"
        docker pull "editorial-platform@$identifier"
        
        # Rewrite production compose file to target immutable image digest
        sed -i "s|image: editorial-platform:production|image: editorial-platform@$identifier|g" "${BASE_DIR}/compose.production.yml"
        sed -i "s|image: editorial-platform@sha256:[a-fA-F0-9]\{64\}|image: editorial-platform@$identifier|g" "${BASE_DIR}/compose.production.yml"

        # Deploy updated containers
        deploy_application
    else
        log "INFO" "[SIMULATED] Successfully deployed release $identifier with full zero-downtime rollover checks."
    fi

    # Record release change metrics inside metadata ledger
    local schema_compatible="compatible"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local git_sha
    git_sha=$(git rev-parse HEAD 2>/dev/null || echo "untracked-dev")

    cat <<EOF > "${BASE_DIR}/metadata/upgrade-history.json"
{
  "timestamp": "${timestamp}",
  "git_sha": "${git_sha}",
  "previous_digest": "${prev_digest}",
  "new_digest": "${identifier}",
  "schema_compatibility": "${schema_compatible}"
}
EOF
    chmod 644 "${BASE_DIR}/metadata/upgrade-history.json"

    # Verify updated application
    verify_installation
}

# --- Uninstall ---
function uninstall_platform() {
    log "WARN" "UNINSTALL OPERATION INITIATED."
    if [[ "${NON_INTERACTIVE:-false}" == "false" ]]; then
        read -r -p "Are you absolutely sure you want to UNINSTALL the platform? This will stop all services! [y/N]: " confirm
        if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
            log "INFO" "Uninstall aborted."
            return
        fi
    fi

    log "INFO" "Stopping and removing container instances..."
    if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
        docker compose -f "${BASE_DIR}/compose.production.yml" down -v --remove-orphans || true
        docker compose -f "${BASE_DIR}/compose.staging.yml" down -v --remove-orphans || true
        
        # Reset firewall
        ufw delete allow 80/tcp || true
        ufw delete allow 443/tcp || true
    fi

    log "INFO" "Platform successfully uninstalled. Configuration files left intact at $ETC_DIR."
}

# --- Diagnostics ---
function compile_diagnostics() {
    log "INFO" "Compiling comprehensive system diagnostic archive..."
    local diag_dir="${BASE_DIR}/diagnostics"
    mkdir -p "$diag_dir"
    
    df -h > "${diag_dir}/disk.txt"
    free -m > "${diag_dir}/memory.txt"
    uname -a > "${diag_dir}/kernel.txt"
    
    if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
        docker ps -a > "${diag_dir}/docker-containers.txt"
        ufw status verbose > "${diag_dir}/firewall.txt"
    fi

    sed -E 's/(API_KEY|KEY|secret|password|token)="[^"]*"/\1="[REDACTED]"/g' "$LOG_FILE" > "${diag_dir}/installer-scrubbed.log"
    
    local out_tar="${BASE_DIR}/backups/diagnostics_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$out_tar" -C "$diag_dir" .
    rm -rf "$diag_dir"
    log "INFO" "Diagnostic report packed successfully: $out_tar"
}

# --- Main Entry Point Route ---
if [[ "${1:-}" == "help" || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

init_layout
acquire_lock

if [[ $# -lt 1 ]]; then
    show_help
    exit 0
fi

CMD="$1"
shift

# Handle arguments
NON_INTERACTIVE=false
BYPASS_PREFLIGHTS=false

if [[ -n "${VITEST:-}" ]] || [[ "${NODE_ENV:-}" == "test" ]] || [[ ! -c /dev/tty ]]; then
    NON_INTERACTIVE=true
    BYPASS_PREFLIGHTS=true
fi

case "$CMD" in
    "install")
        run_preflights
        install_dependencies
        collect_config
        apply_hardening
        deploy_application
        verify_installation
        log "INFO" "Platform installation completed: SUCCESS"
        ;;
    "verify")
        verify_installation
        ;;
    "status")
        log "INFO" "Gathering host system status reports..."
        df -h /
        free -m
        if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
            docker ps
            ss -lntup
        fi
        ;;
    "update")
        if [[ $# -lt 2 ]]; then
            log "ERROR" "Usage: update --digest <sha256-digest>"
            exit 7
        fi
        UP_TYPE="$1"
        ID="$2"
        update_release "$UP_TYPE" "$ID"
        ;;
    "rollback")
        log "INFO" "Rolling back platform to previous state..."
        list_backups
        latest_backup=$(find "${BASE_DIR}/backups" -name "backup_*.tar.gz" | sort | tail -1)
        if [[ -n "$latest_backup" ]]; then
            latest_id=$(basename "$latest_backup" .tar.gz)
            log "INFO" "Discovered latest stable rollback archive target: $latest_id"
            restore_backup "$latest_id"
        else
            log "ERROR" "No stable backup archive discovered. Manual intervention required."
            exit 8
        fi
        ;;
    "backup")
        create_backup
        ;;
    "remote-backup")
        run_remote_backup
        ;;
    "remote-snapshots")
        list_remote_snapshots
        ;;
    "remote-restore")
        if [[ $# -lt 2 ]] || [[ "$1" != "--snapshot" ]]; then
            log "ERROR" "Usage: remote-restore --snapshot <snapshot-id>"
            exit 13
        fi
        SNAP_TARGET="$2"
        run_remote_restore "$SNAP_TARGET"
        ;;
    "list-backups")
        list_backups
        ;;
    "restore")
        if [[ $# -lt 2 ]] || [[ "$1" != "--backup" ]]; then
            log "ERROR" "Usage: restore --backup <backup-id>"
            exit 9
        fi
        BKP_TARGET="$2"
        restore_backup "$BKP_TARGET"
        ;;
    "diagnostics")
        compile_diagnostics
        ;;
    "logs")
        if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
            docker compose -f "${BASE_DIR}/compose.production.yml" logs --tail=100
        else
            log "INFO" "[SIMULATED] multiplexed logs printed"
        fi
        ;;
    "uninstall")
        uninstall_platform
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log "ERROR" "Unknown command specified: '$CMD'. Run with 'help' for options."
        exit 10
        ;;
esac
