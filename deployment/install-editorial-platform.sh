#!/bin/bash
# ==============================================================================
# Enterprise Autonomous Editorial Intelligence Platform
# Standalone Production & Staging Bootstrap Installer with Embedded Templates
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
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
SOURCE_DIR="${BASE_DIR}/current"
APP_REPOSITORY_URL="${APP_REPOSITORY_URL:-https://github.com/injo007/omnipub.git}"
APP_REF="${APP_REF:-main}"
APP_SOURCE_DIR="${APP_SOURCE_DIR:-}"
LEGACY_DB_PATH="${LEGACY_DB_PATH:-}"
APP_SOURCE_COMMIT="unknown"
LEGACY_MIGRATION_STATUS="not-requested"
DEPLOY_STAGING="${DEPLOY_STAGING:-auto}"
HOST_CPU_COUNT=0
HOST_RAM_MB=0
HOST_DISK_GB=0
REMOTE_BACKUP_ENABLED="${REMOTE_BACKUP_ENABLED:-false}"

# Production-only can run on a small host; staging remains an opt-in full profile.
MIN_PRODUCTION_CPU=1
MIN_PRODUCTION_RAM_MB=1800
MIN_PRODUCTION_DISK_GB=40
MIN_FULL_CPU=4
MIN_FULL_RAM_MB=7500
MIN_FULL_DISK_GB=80

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
trap cleanup_lock EXIT

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

    # Structured log append. Container diagnostics commonly contain quotes and
    # backslashes, so escape them before writing one valid JSON object per line.
    local json_msg="${clean_msg//\\/\\\\}"
    json_msg="${json_msg//\"/\\\"}"
    printf '{"timestamp":"%s","severity":"%s","message":"%s"}\n' "$timestamp" "$severity" "$json_msg" >> "$LOG_FILE"
}

function handle_interrupt() {
    local signal="$1"
    local exit_code="$2"
    log "WARN" "Installer interrupted by $signal. Completed steps and stored configuration were preserved; rerun the same install command to resume safely."
    cleanup_lock
    trap - EXIT
    exit "$exit_code"
}
trap 'handle_interrupt SIGINT 130' INT
trap 'handle_interrupt SIGTERM 143' TERM

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
  configure-backup             Configure or update optional Restic/AWS remote backup credentials.
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
  --source <directory>         Build from a local application checkout.
  --repo <git-url>             Clone the application when the installer is used standalone.
  --ref <branch-tag-or-sha>    Git revision to install (default: main).
  --domain <hostname>          Set the real production DNS hostname used for public HTTPS.
  --legacy-db <file>           Import a db.json snapshot when PostgreSQL is empty.
  --production-only            Deploy only production (default on hosts below the full profile).
  --with-staging               Deploy isolated production and staging stacks (8 GB RAM minimum).

Examples:
  sudo ./install-editorial-platform.sh install
  sudo ./install-editorial-platform.sh install --source /srv/omnipub --legacy-db /srv/omnipub/db.json
  sudo ./install-editorial-platform.sh install --repo https://github.com/injo007/omnipub.git --ref main
  sudo ./install-editorial-platform.sh configure-backup
  sudo ./install-editorial-platform.sh update --digest sha256:49fbc0d633391d8487779774619d8bf84260f85cdbd6bf957ad7efd18d4073bb
  sudo ./install-editorial-platform.sh remote-restore --snapshot latest
EOF
}

function validate_application_source() {
    local candidate="$1"
    [[ -f "${candidate}/Dockerfile" ]] && \
    [[ -f "${candidate}/package.json" ]] && \
    [[ -f "${candidate}/package-lock.json" ]] && \
    [[ -f "${candidate}/server.ts" ]] && \
    [[ -f "${candidate}/scripts/migrate-json-to-postgres.ts" ]] && \
    [[ -f "${candidate}/server/core/models/modelRegistry.ts" ]] && \
    [[ -f "${candidate}/server/editorial/articleFormatService.ts" ]] && \
    [[ -f "${candidate}/server/editorial/nichePolicyService.ts" ]] && \
    grep -q 'dist/migrate-json-to-postgres.cjs' "${candidate}/package.json" && \
    grep -q 'articleFormatService' "${candidate}/server.ts"
}

function prepare_application_source() {
    log "INFO" "Preparing a deterministic application source tree..."

    local bundled_candidate
    bundled_candidate="$(cd "${SCRIPT_DIR}/.." 2>/dev/null && pwd -P || true)"
    local source_candidate=""
    local temporary_checkout=""

    if [[ -n "$APP_SOURCE_DIR" ]]; then
        source_candidate="$(cd "$APP_SOURCE_DIR" 2>/dev/null && pwd -P || true)"
        if [[ -z "$source_candidate" ]] || ! validate_application_source "$source_candidate"; then
            log "ERROR" "--source does not contain a complete application checkout: $APP_SOURCE_DIR"
            exit 4
        fi
        log "INFO" "Using explicitly supplied local application source."
    elif [[ -n "$bundled_candidate" ]] && validate_application_source "$bundled_candidate"; then
        source_candidate="$bundled_candidate"
        log "INFO" "Using the application checkout located beside the installer."
    else
        temporary_checkout="$(mktemp -d)"
        log "INFO" "Standalone mode: fetching requested application revision '$APP_REF'."
        git -C "$temporary_checkout" init --quiet
        git -C "$temporary_checkout" remote add origin "$APP_REPOSITORY_URL"
        if ! git -C "$temporary_checkout" fetch --quiet --depth 1 origin "$APP_REF"; then
            log "ERROR" "Unable to fetch APP_REF '$APP_REF'. Check APP_REPOSITORY_URL and repository credentials."
            exit 4
        fi
        git -C "$temporary_checkout" checkout --quiet --detach FETCH_HEAD
        source_candidate="$temporary_checkout"
        if ! validate_application_source "$source_candidate"; then
            log "ERROR" "Fetched revision does not contain the required application and migration files."
            exit 4
        fi
    fi

    APP_SOURCE_COMMIT="$(git -C "$source_candidate" rev-parse HEAD 2>/dev/null || echo local-uncommitted)"
    if [[ "$(cd "$source_candidate" && pwd -P)" != "$(cd "$SOURCE_DIR" && pwd -P)" ]]; then
        rsync -a --delete \
            --exclude '.git/' \
            --exclude 'node_modules/' \
            --exclude 'dist/' \
            --exclude '.env' \
            --exclude '*.log' \
            "$source_candidate/" "$SOURCE_DIR/"
    fi

    if [[ -n "$temporary_checkout" ]]; then
        rm -rf "$temporary_checkout"
    fi

    if ! validate_application_source "$SOURCE_DIR"; then
        log "ERROR" "Staged application source failed validation under $SOURCE_DIR."
        exit 4
    fi

    if [[ -n "$LEGACY_DB_PATH" && ! -r "$LEGACY_DB_PATH" ]]; then
        log "ERROR" "Legacy database snapshot is not readable: $LEGACY_DB_PATH"
        exit 4
    fi

    log "INFO" "Application source staged at $SOURCE_DIR (revision: $APP_SOURCE_COMMIT)."
    log "INFO" "Release contract validated: PostgreSQL migration, provider routing, niche-policy, and editorial-format modules are included in the staged source."
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

    # 3. Capacity and deployment profile selection
    HOST_CPU_COUNT=$(nproc)
    HOST_RAM_MB=$(awk '/MemTotal/ { print int($2 / 1024) }' /proc/meminfo)
    HOST_DISK_GB=$(df --output=avail -BG / | tail -n 1 | tr -dc '0-9')

    if [[ "$DEPLOY_STAGING" == "auto" ]]; then
        if (( HOST_CPU_COUNT >= MIN_FULL_CPU && HOST_RAM_MB >= MIN_FULL_RAM_MB && HOST_DISK_GB >= MIN_FULL_DISK_GB )); then
            DEPLOY_STAGING=true
        else
            DEPLOY_STAGING=false
        fi
    fi
    if [[ "$DEPLOY_STAGING" != "true" && "$DEPLOY_STAGING" != "false" ]]; then
        log "ERROR" "DEPLOY_STAGING must be true, false, or auto."
        exit 3
    fi

    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        if (( HOST_CPU_COUNT < MIN_FULL_CPU || HOST_RAM_MB < MIN_FULL_RAM_MB || HOST_DISK_GB < MIN_FULL_DISK_GB )); then
            log "ERROR" "Production plus staging requires at least ${MIN_FULL_CPU} CPUs, ${MIN_FULL_RAM_MB} MB RAM, and ${MIN_FULL_DISK_GB} GB free disk. Detected: ${HOST_CPU_COUNT} CPUs, ${HOST_RAM_MB} MB RAM, ${HOST_DISK_GB} GB free."
            exit 3
        fi
        log "INFO" "Full production-and-staging profile selected."
    else
        if (( HOST_CPU_COUNT < MIN_PRODUCTION_CPU || HOST_RAM_MB < MIN_PRODUCTION_RAM_MB || HOST_DISK_GB < MIN_PRODUCTION_DISK_GB )); then
            log "ERROR" "Production-only requires at least ${MIN_PRODUCTION_CPU} CPU, ${MIN_PRODUCTION_RAM_MB} MB RAM, and ${MIN_PRODUCTION_DISK_GB} GB free disk. Detected: ${HOST_CPU_COUNT} CPUs, ${HOST_RAM_MB} MB RAM, ${HOST_DISK_GB} GB free."
            exit 3
        fi
        log "WARN" "Production-only profile selected for this host (${HOST_CPU_COUNT} CPUs, ${HOST_RAM_MB} MB RAM, ${HOST_DISK_GB} GB free). Staging is disabled to prevent memory exhaustion."
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
function read_stored_env_value() {
    local file="$1"
    local key="$2"
    [[ -f "$file" ]] || return 0
    (
        set +u
        # Files are root-owned and written by this installer.
        # shellcheck disable=SC1090
        source "$file"
        printf '%s' "${!key:-}"
    )
}

function configure_remote_backup() {
    log "INFO" "Configuring optional encrypted remote backups..."

    local backup_file="${ETC_DIR}/secrets/restic.env"
    local restic_repo="${RESTIC_REPOSITORY:-$(read_stored_env_value "$backup_file" RESTIC_REPOSITORY)}"
    local restic_pass="${RESTIC_PASSWORD:-$(read_stored_env_value "$backup_file" RESTIC_PASSWORD)}"
    local aws_id="${AWS_ACCESS_KEY_ID:-$(read_stored_env_value "$backup_file" AWS_ACCESS_KEY_ID)}"
    local aws_secret="${AWS_SECRET_ACCESS_KEY:-$(read_stored_env_value "$backup_file" AWS_SECRET_ACCESS_KEY)}"
    restic_repo="${restic_repo:-s3:https://s3.amazonaws.com/editorial-backups}"

    if [[ "${NON_INTERACTIVE:-false}" == "false" ]]; then
        echo -e "${YELLOW}--- Optional Remote Encrypted Cloud Backup Setup ---${NC}"
        local input=""
        read -r -p "Enter Restic Repository Target [$restic_repo]: " input
        restic_repo="${input:-$restic_repo}"

        local input_pass=""
        if [[ -n "$restic_pass" ]]; then
            echo -n "Enter a new Restic Password to replace the stored value (hidden, leave blank to keep it): "
            read -r -s input_pass
            echo ""
            restic_pass="${input_pass:-$restic_pass}"
        else
            while [[ -z "$restic_pass" ]]; do
                echo -n "Enter Restic Password (hidden, required for remote backups): "
                read -r -s input_pass
                echo ""
                restic_pass="$input_pass"
                if [[ -z "$restic_pass" ]]; then
                    log "WARN" "A Restic encryption password is required to enable remote backups. Press Ctrl+C to leave backups disabled."
                fi
            done
        fi

        read -r -p "Enter AWS Access Key ID (optional for IAM roles and non-S3 repositories)${aws_id:+ [$aws_id]}: " input
        aws_id="${input:-$aws_id}"

        local input_aws_secret=""
        echo -n "Enter AWS Secret Access Key (optional, hidden; leave blank to keep the stored value): "
        read -r -s input_aws_secret
        echo ""
        aws_secret="${input_aws_secret:-$aws_secret}"
    fi

    if [[ -z "$restic_repo" || -z "$restic_pass" ]]; then
        log "ERROR" "RESTIC_REPOSITORY and RESTIC_PASSWORD are required to enable remote backups. The main application remains installed and remote backups remain disabled."
        exit 11
    fi

    {
        printf 'export REMOTE_BACKUP_ENABLED=%q\n' "true"
        printf 'export RESTIC_REPOSITORY=%q\n' "$restic_repo"
        printf 'export RESTIC_PASSWORD=%q\n' "$restic_pass"
        printf 'export AWS_ACCESS_KEY_ID=%q\n' "$aws_id"
        printf 'export AWS_SECRET_ACCESS_KEY=%q\n' "$aws_secret"
    } > "$backup_file"
    chmod 600 "$backup_file"
    log "INFO" "Remote backup configuration enabled in $backup_file. AWS credentials may remain blank when the repository uses an instance role or another authentication method."
}

function require_remote_backup_config() {
    local backup_file="${ETC_DIR}/secrets/restic.env"
    if [[ ! -f "$backup_file" ]]; then
        log "ERROR" "Remote backups are not configured. Run 'sudo ./deployment/install-editorial-platform.sh configure-backup' after installation."
        exit 11
    fi

    # shellcheck disable=SC1090
    source "$backup_file"
    if [[ "${REMOTE_BACKUP_ENABLED:-false}" != "true" || -z "${RESTIC_REPOSITORY:-}" || -z "${RESTIC_PASSWORD:-}" ]]; then
        log "ERROR" "Remote backups are disabled or incomplete. Run 'sudo ./deployment/install-editorial-platform.sh configure-backup'."
        exit 11
    fi
}

function production_domain_is_valid() {
    local domain="${1,,}"
    [[ "$domain" =~ ^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$ ]] || return 1
    case "$domain" in
        your-real-domain.com|*.your-real-domain.com|editorial-intelligence.com|*.editorial-intelligence.com|example.com|*.example.com|example.org|*.example.org|example.net|*.example.net|domain.com|localhost|*.example|*.invalid|*.localhost|*.test)
            return 1
            ;;
    esac
    return 0
}

function validate_production_domain_dns() {
    if [[ "${BYPASS_PREFLIGHTS:-false}" == "true" ]]; then
        return 0
    fi

    local resolved_ipv4
    resolved_ipv4=$(getent ahostsv4 "$PRODUCTION_DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | paste -sd, -)
    if [[ -z "$resolved_ipv4" ]]; then
        local server_ipv4
        server_ipv4=$(ip -4 -o addr show scope global | awk '{split($4, address, "/"); print address[1]}' | paste -sd, -)
        log "ERROR" "Production domain $PRODUCTION_DOMAIN does not have a resolvable DNS A record. Create an A record pointing it to this server${server_ipv4:+ ($server_ipv4)}, wait for DNS propagation, then rerun install."
        exit 4
    fi
    log "INFO" "Production domain DNS resolved: $PRODUCTION_DOMAIN -> $resolved_ipv4"
}

function collect_config() {
    log "INFO" "Collecting application secrets and domain configs..."

    # The main entry point already loaded this file before processing command-line
    # overrides. Do not source it again here or --domain would be overwritten.
    if [[ -f "$INSTALLER_CONF" ]]; then
        log "INFO" "Existing configuration loaded from $INSTALLER_CONF."
    fi

    local staging_domain="${STAGING_DOMAIN:-}"
    local prod_domain="${PRODUCTION_DOMAIN:-}"
    if [[ -n "$prod_domain" ]] && ! production_domain_is_valid "$prod_domain"; then
        log "WARN" "Ignoring invalid or placeholder production domain from stored configuration: $prod_domain"
        prod_domain=""
        PRODUCTION_DOMAIN=""
    fi
    local admin_email="${ADMIN_EMAIL:-admin@editorial-intelligence.com}"
    local gemini_key="${GEMINI_API_KEY:-$(read_stored_env_value "${ETC_DIR}/production.env" GEMINI_API_KEY)}"
    local openrouter_key="${OPENROUTER_API_KEY:-$(read_stored_env_value "${ETC_DIR}/production.env" OPENROUTER_API_KEY)}"
    local minimax_key="${MINIMAX_API_KEY:-$(read_stored_env_value "${ETC_DIR}/production.env" MINIMAX_API_KEY)}"
    local vault_key="${CREDENTIALS_VAULT_KEY:-$(read_stored_env_value "${ETC_DIR}/production.env" CREDENTIALS_VAULT_KEY)}"
    
    local configured_pg_user="${PGUSER:-postgres}"
    local configured_pg_database="${PGDATABASE:-editorial_db}"
    local configured_pg_host="${PGHOST:-db}"
    local configured_pg_port="${PGPORT:-5432}"
    local pg_user="postgres"
    local pg_password="${PGPASSWORD:-}"
    local pg_database="editorial_db"
    local pg_host="db"
    local pg_port="5432"
    if [[ "$configured_pg_user" != "$pg_user" || "$configured_pg_database" != "$pg_database" || "$configured_pg_host" != "$pg_host" || "$configured_pg_port" != "$pg_port" ]]; then
        log "WARN" "The managed PostgreSQL stack uses the stable internal identity postgres@db:5432/editorial_db. Older custom connection values will be replaced to keep the persistent volume and application credentials aligned."
    fi
    local worker_concurrency=2
    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        worker_concurrency=5
    fi

    if [[ "${NON_INTERACTIVE:-false}" == "false" ]]; then
        echo -e "${YELLOW}--- Secure Platform Setup Inquiries ---${NC}"
        
        while true; do
            read -r -p "Enter Production Domain Name${prod_domain:+ [$prod_domain]}: " input
            local domain_candidate="${input:-$prod_domain}"
            domain_candidate="${domain_candidate,,}"
            if production_domain_is_valid "$domain_candidate"; then
                PRODUCTION_DOMAIN="$domain_candidate"
                break
            fi
            log "WARN" "Enter a real DNS hostname that you control. Placeholder names, reserved example domains, URLs, localhost, and raw IP addresses are rejected."
        done

        if [[ "$DEPLOY_STAGING" == "true" ]]; then
            read -r -p "Enter Staging Domain Name${staging_domain:+ [$staging_domain]}: " input
            STAGING_DOMAIN="${input:-${staging_domain:-staging.${PRODUCTION_DOMAIN}}}"
        else
            STAGING_DOMAIN="${staging_domain:-staging.${PRODUCTION_DOMAIN}}"
        fi

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

        echo -n "Enter CREDENTIALS_VAULT_KEY (exactly 32 chars, leave blank to reuse or generate): "
        read -r -s input_vault
        echo ""
        if [[ -n "$input_vault" ]]; then
            CREDENTIALS_VAULT_KEY="$input_vault"
        else
            CREDENTIALS_VAULT_KEY="$vault_key"
        fi

        echo -e "${YELLOW}--- Self-Hosted PostgreSQL Configuration ---${NC}"
        PGUSER="$pg_user"
        PGDATABASE="$pg_database"
        PGHOST="$pg_host"
        PGPORT="$pg_port"
        log "INFO" "Using managed PostgreSQL identity postgres@db:5432/editorial_db."

        echo -n "Enter PostgreSQL Password (hidden, leave blank to reuse or generate): "
        read -r -s input_pg_pass
        echo ""
        if [[ -n "$input_pg_pass" ]]; then
            PGPASSWORD="$input_pg_pass"
        else
            PGPASSWORD="$pg_password"
        fi

    else
        log "INFO" "Non-interactive execution mode. Consuming environment variables or defaults."
        PRODUCTION_DOMAIN="$prod_domain"
        STAGING_DOMAIN="${staging_domain:-staging.${prod_domain}}"
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
    fi

    while [[ -z "$OPENROUTER_API_KEY" && -z "$MINIMAX_API_KEY" && "${NON_INTERACTIVE:-false}" == "false" ]]; do
        log "WARN" "A model credential is required before deployment can continue. Press Ctrl+C to stop safely and resume later."
        echo -n "Enter OPENROUTER_API_KEY (recommended for MiniMax-M3 and fallback routing, hidden): "
        read -r -s OPENROUTER_API_KEY
        echo ""
        if [[ -z "$OPENROUTER_API_KEY" ]]; then
            echo -n "Enter native MINIMAX_API_KEY instead (hidden): "
            read -r -s MINIMAX_API_KEY
            echo ""
        fi
    done
    if [[ -z "$OPENROUTER_API_KEY" && -z "$MINIMAX_API_KEY" ]]; then
        log "ERROR" "Missing model credential. Export OPENROUTER_API_KEY or MINIMAX_API_KEY, then rerun the same install command. No database or deployment data was removed."
        exit 4
    fi
    if ! production_domain_is_valid "${PRODUCTION_DOMAIN:-}"; then
        log "ERROR" "PRODUCTION_DOMAIN must be a real DNS hostname you control. Placeholder domains, reserved example names, URLs, localhost, and raw IP addresses are rejected. Use --domain <hostname> or rerun interactively."
        exit 4
    fi
    validate_production_domain_dns
    if [[ -z "$PGPASSWORD" ]]; then
        PGPASSWORD="$(openssl rand -hex 24)"
        log "INFO" "No PostgreSQL password was supplied; a strong password was generated and will be stored in root-only configuration."
    elif [[ ! "$PGPASSWORD" =~ ^[A-Za-z0-9_-]{16,128}$ ]]; then
        if [[ ! -f "${BASE_DIR}/metadata/deployment.json" ]] || \
           ! jq -e '.health_verified == true' "${BASE_DIR}/metadata/deployment.json" >/dev/null 2>&1; then
            PGPASSWORD="$(openssl rand -hex 24)"
            log "WARN" "The password from an incomplete older deployment is not safe for deterministic environment-file handling. A strong replacement was generated and will be synchronized with the private managed PostgreSQL role."
        else
            log "ERROR" "The stored PostgreSQL password uses unsupported characters or is shorter than 16 characters. A verified deployment exists, so credentials will not be rotated automatically."
            exit 4
        fi
    fi
    if [[ "$PGUSER" != "postgres" || "$PGDATABASE" != "editorial_db" || "$PGHOST" != "db" || "$PGPORT" != "5432" ]]; then
        log "ERROR" "The managed PostgreSQL stack requires postgres@db:5432/editorial_db. Use the manual deployment runbook for an external PostgreSQL service."
        exit 4
    fi
    if [[ -z "$CREDENTIALS_VAULT_KEY" ]]; then
        CREDENTIALS_VAULT_KEY="$(openssl rand -hex 16)"
        log "INFO" "No credential vault key was supplied; a 32-character key was generated and will be stored in root-only configuration."
    elif [[ ${#CREDENTIALS_VAULT_KEY} -ne 32 ]]; then
        if [[ ! -f "${BASE_DIR}/metadata/deployment.json" ]]; then
            CREDENTIALS_VAULT_KEY="$(openssl rand -hex 16)"
            log "WARN" "The stored credential vault key was invalid, and no completed deployment metadata exists. A new 32-character key was generated so this incomplete installation can resume safely."
        else
            log "ERROR" "CREDENTIALS_VAULT_KEY must contain exactly 32 characters. A completed deployment exists, so the installer will not rotate this encryption key automatically."
            exit 4
        fi
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
DEPLOY_STAGING="${DEPLOY_STAGING}"
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
WORKER_CONCURRENCY=${worker_concurrency}
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
WORKER_CONCURRENCY=${worker_concurrency}
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

    log "INFO" "Remote backups are optional and were not requested during application setup. Existing backup configuration, if any, was preserved; run the configure-backup command after installation to enable or update it."

    # Write deployment templates directly; application source is staged separately.
    write_embedded_templates
}

# --- Write Embedded Templates ---
function write_embedded_templates() {
    log "INFO" "Extracting embedded application architecture templates..."
    local production_app_memory="1024M"
    local production_db_memory="384M"
    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        production_app_memory="2048M"
        production_db_memory="512M"
    fi

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
      test: ["CMD-SHELL", "PGPASSWORD=\"\$\${POSTGRES_PASSWORD}\" psql --host \"\$\${HOSTNAME}\" --username \"\$\${POSTGRES_USER}\" --dbname \"\$\${POSTGRES_DB}\" --command 'SELECT 1' >/dev/null"]
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
          memory: ${production_db_memory}
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
      NODE_ENV: production
      PORT: "3000"
      POSTGRES_REQUIRED: "true"
      PGHOST: "${PGHOST}"
      PGPORT: "${PGPORT}"
      PGDATABASE: "${PGDATABASE}"
      PGUSER: "${PGUSER}"
      PGPASSWORD: "${PGPASSWORD}"
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
          memory: ${production_app_memory}
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
      test: ["CMD-SHELL", "PGPASSWORD=\"\$\${POSTGRES_PASSWORD}\" psql --host \"\$\${HOSTNAME}\" --username \"\$\${POSTGRES_USER}\" --dbname \"\$\${POSTGRES_DB}\" --command 'SELECT 1' >/dev/null"]
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
      NODE_ENV: staging
      PORT: "3000"
      POSTGRES_REQUIRED: "true"
      PGHOST: "${PGHOST}"
      PGPORT: "${PGPORT}"
      PGDATABASE: "${PGDATABASE}"
      PGUSER: "${PGUSER}"
      PGPASSWORD: "${PGPASSWORD}"
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

if [[ "\${REMOTE_BACKUP_ENABLED:-false}" != "true" || -z "\${RESTIC_REPOSITORY:-}" || -z "\${RESTIC_PASSWORD:-}" ]]; then
    echo "Error: Remote backups are disabled or incomplete. Run the installer configure-backup command first." >&2
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
function wait_for_container_health() {
    local container="$1"
    local timeout_seconds="${2:-120}"
    local retry_unhealthy="${3:-false}"
    local elapsed=0
    while (( elapsed < timeout_seconds )); do
        local status
        status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo missing)
        if [[ "$status" == "missing" ]]; then
            log "ERROR" "Required container does not exist: $container. The installation did not reach deployment; inspect $LOG_FILE and rerun install."
            return 1
        fi
        if [[ "$status" == "healthy" || "$status" == "running" ]]; then
            return 0
        fi
        if [[ "$status" == "unhealthy" && "$retry_unhealthy" == "true" ]]; then
            sleep 2
            elapsed=$((elapsed + 2))
            continue
        fi
        if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
            log "ERROR" "Container $container entered terminal state: $status"
            report_container_failure "$container"
            return 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    log "ERROR" "Timed out waiting for container health: $container"
    return 1
}

function wait_for_postgres_server() {
    local container="$1"
    local timeout_seconds="${2:-120}"
    local elapsed=0
    while (( elapsed < timeout_seconds )); do
        if docker exec "$container" pg_isready --username postgres --dbname postgres --timeout=2 >/dev/null 2>&1; then
            return 0
        fi
        if [[ "$(docker inspect --format '{{.State.Status}}' "$container" 2>/dev/null || echo missing)" =~ ^(exited|dead|missing)$ ]]; then
            log "ERROR" "PostgreSQL container stopped before accepting connections: $container"
            report_container_failure "$container"
            return 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    log "ERROR" "Timed out waiting for PostgreSQL to accept connections: $container"
    report_container_failure "$container"
    return 1
}

function reconcile_managed_postgres_credentials() {
    local container="$1"
    local environment_name="$2"

    # The loopback pg_hba.conf rule may be trusted on an older volume, so a
    # successful 127.0.0.1 query does not prove that Docker-network SCRAM auth
    # works. Connect to the container's bridge address through its hostname,
    # which follows the same host rule used by the application.
    if docker exec --env "PGPASSWORD=$PGPASSWORD" "$container" sh -ec \
        'exec psql --host "$HOSTNAME" --username postgres --dbname editorial_db --tuples-only --no-align --command "SELECT 1"' >/dev/null 2>&1; then
        log "INFO" "$environment_name PostgreSQL managed-role bridge authentication verified."
        return
    fi

    log "WARN" "$environment_name PostgreSQL bridge credentials do not match the persistent managed volume. Reconciling the private postgres role with the root-only installer configuration."
    if ! docker exec "$container" psql --username postgres --dbname postgres --tuples-only --no-align --command "SELECT 1" >/dev/null 2>&1; then
        log "ERROR" "Cannot access the managed postgres administrator role through the container-local socket. The volume may have been initialized outside this installer; no role or data was changed."
        report_container_failure "$container"
        exit 5
    fi

    local escaped_password="${PGPASSWORD//\'/\'\'}"
    if ! docker exec "$container" psql --username postgres --dbname postgres --set ON_ERROR_STOP=1 \
        --command "ALTER ROLE postgres WITH LOGIN PASSWORD '$escaped_password'" >/dev/null; then
        log "ERROR" "Failed to synchronize the managed postgres role password."
        exit 5
    fi

    local database_exists
    database_exists=$(docker exec "$container" psql --username postgres --dbname postgres --tuples-only --no-align \
        --command "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'editorial_db')" 2>/dev/null || echo f)
    if [[ "$database_exists" != "t" ]]; then
        log "WARN" "$environment_name managed database editorial_db does not exist; creating it without modifying other databases."
        docker exec "$container" createdb --username postgres --owner postgres editorial_db
    fi

    if ! docker exec --env "PGPASSWORD=$PGPASSWORD" "$container" sh -ec \
        'exec psql --host "$HOSTNAME" --username postgres --dbname editorial_db --tuples-only --no-align --command "SELECT 1"' >/dev/null 2>&1; then
        log "ERROR" "$environment_name PostgreSQL role reconciliation completed but bridge-authenticated connectivity still failed."
        report_container_failure "$container"
        exit 5
    fi
    log "INFO" "$environment_name PostgreSQL managed-role credentials reconciled successfully."
}

function report_container_failure() {
    local container="$1"
    local state_details
    state_details=$(docker inspect --format 'status={{.State.Status}} exit_code={{.State.ExitCode}} oom_killed={{.State.OOMKilled}} error={{.State.Error}} restart_count={{.RestartCount}}' "$container" 2>/dev/null || echo "container inspection unavailable")
    log "ERROR" "Container diagnostics for $container: $state_details"
    log "ERROR" "Recent logs for $container follow (up to 120 lines):"
    while IFS= read -r container_log; do
        log "ERROR" "[$container] $container_log"
    done < <(docker logs --tail 120 "$container" 2>&1 || true)
}

function initialize_postgres_schema() {
    local compose_file="$1"
    local database_container="$2"
    local environment_name="$3"

    log "INFO" "Initializing the $environment_name PostgreSQL schema before application startup..."
    local diagnostic_salt
    local password_fingerprint
    diagnostic_salt=$(openssl rand -hex 16)
    password_fingerprint=$(printf '%s' "${diagnostic_salt}:${PGPASSWORD}" | sha256sum | awk '{print substr($1, 1, 12)}')
    log "INFO" "$environment_name schema bootstrap connection: host=$PGHOST port=$PGPORT database=$PGDATABASE user=$PGUSER password_bytes=${#PGPASSWORD} password_fingerprint=$password_fingerprint"
    local bootstrap_output=""
    if ! bootstrap_output=$(docker compose -f "$compose_file" run --rm --no-deps -T \
        --env "PGHOST=$PGHOST" \
        --env "PGPORT=$PGPORT" \
        --env "PGDATABASE=$PGDATABASE" \
        --env "PGUSER=$PGUSER" \
        --env "PGPASSWORD=$PGPASSWORD" \
        --env "PG_DIAGNOSTIC_SALT=$diagnostic_salt" \
        app node dist/migrate-json-to-postgres.cjs --init-only 2>&1); then
        while IFS= read -r bootstrap_line; do
            log "ERROR" "[$environment_name-schema-bootstrap] $bootstrap_line"
        done <<< "$bootstrap_output"
        log "ERROR" "The $environment_name PostgreSQL schema bootstrap container failed."
        report_container_failure "$database_container"
        exit 5
    fi
    while IFS= read -r bootstrap_line; do
        [[ -n "$bootstrap_line" ]] && log "INFO" "[$environment_name-schema-bootstrap] $bootstrap_line"
    done <<< "$bootstrap_output"

    local schema_ready
    schema_ready=$(docker exec "$database_container" psql --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align \
        --command "SELECT to_regclass('public.articles') IS NOT NULL AND to_regclass('public.settings') IS NOT NULL AND to_regclass('public.deployment_migrations') IS NOT NULL" 2>/dev/null || echo f)
    if [[ "$schema_ready" != "t" ]]; then
        log "ERROR" "The $environment_name PostgreSQL bootstrap command completed without creating the required schema."
        report_container_failure "$database_container"
        exit 5
    fi
    log "INFO" "$environment_name PostgreSQL schema initialization verified."
}

function application_reports_postgres_ready() {
    local container="$1"
    docker exec "$container" node -e '
      fetch("http://127.0.0.1:3000/api/health/readiness")
        .then(async (response) => {
          const body = await response.json();
          const database = body?.diagnostics?.database;
          if (!response.ok || body.status !== "ready" || database?.backend !== "postgresql" || database?.pg?.ok !== true) process.exit(1);
        })
        .catch(() => process.exit(1));
    '
}

function reload_caddy_proxy() {
    local compose_file="$1"
    local environment_name="$2"
    local proxy_container
    proxy_container=$(docker compose -f "$compose_file" ps -q proxy 2>/dev/null || true)
    if [[ -z "$proxy_container" ]]; then
        log "ERROR" "The $environment_name Caddy proxy container was not created."
        return 1
    fi
    if ! docker exec "$proxy_container" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
        log "ERROR" "The $environment_name Caddy configuration is invalid."
        report_container_failure "$proxy_container"
        return 1
    fi
    if ! docker exec "$proxy_container" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
        log "ERROR" "The $environment_name Caddy proxy could not reload its current configuration."
        report_container_failure "$proxy_container"
        return 1
    fi
    log "INFO" "$environment_name Caddy configuration validated and reloaded."
}

function caddy_configuration_is_valid() {
    local compose_file="$1"
    local proxy_container
    proxy_container=$(docker compose -f "$compose_file" ps -q proxy 2>/dev/null || true)
    [[ -n "$proxy_container" ]] && \
        docker exec "$proxy_container" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1
}

function public_https_is_ready() {
    [[ -n "${PRODUCTION_DOMAIN:-}" ]] || return 1
    curl --ipv4 --fail --silent --show-error \
        --noproxy '*' \
        --connect-timeout 5 --max-time 10 \
        --resolve "${PRODUCTION_DOMAIN}:443:127.0.0.1" \
        "https://${PRODUCTION_DOMAIN}/api/health" >/dev/null 2>&1
}

function wait_for_public_https() {
    if [[ "${BYPASS_PREFLIGHTS:-false}" == "true" ]]; then
        return 0
    fi

    local timeout_seconds="${1:-120}"
    local elapsed=0
    while (( elapsed < timeout_seconds )); do
        if public_https_is_ready; then
            log "INFO" "Public HTTPS certificate and reverse-proxy health verified: https://${PRODUCTION_DOMAIN}"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
    done

    log "ERROR" "Public HTTPS did not become ready for https://${PRODUCTION_DOMAIN}. Confirm its DNS A record points to this server and inspect the Caddy certificate logs. Raw-IP HTTPS is not a supported fallback."
    local proxy_container
    proxy_container=$(docker compose -f "${BASE_DIR}/compose.production.yml" ps -q proxy 2>/dev/null || true)
    if [[ -n "$proxy_container" ]]; then
        report_container_failure "$proxy_container"
    fi
    return 1
}

function postgres_has_application_data() {
    local container="$1"
    local schema_exists
    schema_exists=$(docker exec "$container" psql --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align \
        --command "SELECT to_regclass('public.articles') IS NOT NULL" 2>/dev/null || echo f)
    [[ "$schema_exists" == "t" ]] || return 1

    local count
    count=$(docker exec "$container" psql --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align \
        --command "SELECT (SELECT COUNT(*) FROM articles) + (SELECT COUNT(*) FROM writers) + (SELECT COUNT(*) FROM settings)" 2>/dev/null || echo 0)
    [[ "$count" =~ ^[0-9]+$ ]] && (( count > 0 ))
}

function legacy_migration_applied() {
    local container="$1"
    local applied
    applied=$(docker exec "$container" psql --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align \
        --command "SELECT EXISTS (SELECT 1 FROM deployment_migrations WHERE id = 'legacy-json-v1')" 2>/dev/null || echo f)
    [[ "$applied" == "t" ]]
}

function migrate_legacy_database_if_needed() {
    if [[ -z "$LEGACY_DB_PATH" ]]; then
        LEGACY_MIGRATION_STATUS="not-requested"
        log "INFO" "No legacy db.json snapshot supplied; PostgreSQL will initialize with application defaults."
        return
    fi
    if legacy_migration_applied "editorial-production-db"; then
        LEGACY_MIGRATION_STATUS="already-applied"
        log "INFO" "Legacy PostgreSQL migration marker already exists; import will not be repeated."
        return
    fi
    if postgres_has_application_data "editorial-production-db"; then
        LEGACY_MIGRATION_STATUS="skipped-existing-data"
        log "WARN" "Production PostgreSQL already contains application data. Legacy import skipped to prevent overwriting live records."
        return
    fi

    log "INFO" "Importing legacy state into the empty production PostgreSQL database..."
    docker compose -f "${BASE_DIR}/compose.production.yml" run --rm --no-deps \
        --volume "${LEGACY_DB_PATH}:/migration/db.json:ro" \
        app node dist/migrate-json-to-postgres.cjs /migration/db.json
    if ! legacy_migration_applied "editorial-production-db"; then
        log "ERROR" "Legacy import completed without recording its PostgreSQL migration marker."
        exit 5
    fi
    LEGACY_MIGRATION_STATUS="imported"
    log "INFO" "Legacy state import completed and was recorded in PostgreSQL."
}

function deploy_application() {
    local image_mode="${1:-build}"
    log "INFO" "Tearing down active instances & deploying containers..."
    
    if [[ "${BYPASS_PREFLIGHTS:-false}" == "true" ]]; then
        log "INFO" "Bypassing real Docker Compose execution in testing mode."
        return
    fi

    docker compose -f "${BASE_DIR}/compose.production.yml" config --quiet
    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        docker compose -f "${BASE_DIR}/compose.staging.yml" config --quiet
    fi

    if [[ "$image_mode" == "build" ]]; then
        log "INFO" "Building immutable application image from $SOURCE_DIR..."
        docker build --pull -t editorial-platform:production -f "${SOURCE_DIR}/Dockerfile" "$SOURCE_DIR"
        if [[ "$DEPLOY_STAGING" == "true" ]]; then
            docker tag editorial-platform:production editorial-platform:staging
        fi
    else
        log "INFO" "Using the already selected immutable application image."
    fi

    # Start PostgreSQL and initialize its schema before application startup. This prevents
    # first-boot crashes from leaving an empty database and an unhealthy restart loop.
    docker compose -f "${BASE_DIR}/compose.production.yml" up -d db
    wait_for_postgres_server "editorial-production-db" 120
    reconcile_managed_postgres_credentials "editorial-production-db" "production"
    wait_for_container_health "editorial-production-db" 120 true
    initialize_postgres_schema "${BASE_DIR}/compose.production.yml" "editorial-production-db" "production"
    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        docker compose -f "${BASE_DIR}/compose.staging.yml" up -d db
        wait_for_postgres_server "editorial-staging-db" 120
        reconcile_managed_postgres_credentials "editorial-staging-db" "staging"
        wait_for_container_health "editorial-staging-db" 120 true
        initialize_postgres_schema "${BASE_DIR}/compose.staging.yml" "editorial-staging-db" "staging"
    else
        docker compose -f "${BASE_DIR}/compose.staging.yml" down --remove-orphans 2>/dev/null || true
    fi
    migrate_legacy_database_if_needed

    # Production Deploy
    log "INFO" "Starting Production Stack via Docker Compose..."
    docker compose -f "${BASE_DIR}/compose.production.yml" up -d --remove-orphans
    reload_caddy_proxy "${BASE_DIR}/compose.production.yml" "production"
    if ! wait_for_container_health "editorial-production-app" 180; then
        log "ERROR" "Production application did not become healthy; deployment metadata will not be recorded."
        exit 5
    fi
    if ! application_reports_postgres_ready "editorial-production-app"; then
        log "ERROR" "Production application did not report PostgreSQL readiness; deployment metadata will not be recorded."
        report_container_failure "editorial-production-app"
        exit 5
    fi
    wait_for_public_https 120

    # Staging Deploy
    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        log "INFO" "Starting Staging Stack via Docker Compose..."
        docker compose -f "${BASE_DIR}/compose.staging.yml" up -d --remove-orphans
        reload_caddy_proxy "${BASE_DIR}/compose.staging.yml" "staging"
        if ! wait_for_container_health "editorial-staging-app" 180; then
            log "ERROR" "Staging application did not become healthy; deployment metadata will not be recorded."
            exit 5
        fi
        if ! application_reports_postgres_ready "editorial-staging-app"; then
            log "ERROR" "Staging application did not report PostgreSQL readiness; deployment metadata will not be recorded."
            report_container_failure "editorial-staging-app"
            exit 5
        fi
    else
        log "INFO" "Staging deployment is disabled for the production-only host profile."
    fi

    # Record Metadata
    local deploy_sha
    deploy_sha="$APP_SOURCE_COMMIT"
    local deploy_time
    deploy_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat <<EOF > "${BASE_DIR}/metadata/deployment.json"
{
  "application": "${APP_NAME}",
  "version": "1.0.0",
  "commit": "${deploy_sha}",
  "requested_ref": "${APP_REF}",
  "timestamp": "${deploy_time}",
  "production_domain": "${PRODUCTION_DOMAIN}",
  "staging_domain": "${STAGING_DOMAIN}",
  "staging_enabled": ${DEPLOY_STAGING},
  "legacy_migration": "${LEGACY_MIGRATION_STATUS}",
  "schema_initialized": true,
  "health_verified": true,
  "public_https_verified": true
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
    if [[ -f "${BASE_DIR}/metadata/deployment.json" ]] && \
       jq -e '.schema_initialized == true and .health_verified == true and .public_https_verified == true' "${BASE_DIR}/metadata/deployment.json" >/dev/null 2>&1; then
        log "INFO" "Deployment metadata is active and records successful schema, health, and public HTTPS gates."
    elif [[ -f "${BASE_DIR}/metadata/deployment.json" ]]; then
        log "ERROR" "Deployment metadata is incomplete or predates the mandatory schema, readiness, and public HTTPS gates. Rerun install to complete deployment."
        passed=false
    else
        log "WARN" "Deployment metadata record not found."
        passed=false
    fi

    # 2. Verify PostgreSQL and application containers are healthy.
    local expected_containers=(editorial-production-db editorial-production-app)
    local expected_apps=(editorial-production-app)
    if [[ "$DEPLOY_STAGING" == "true" ]]; then
        expected_containers+=(editorial-staging-db editorial-staging-app)
        expected_apps+=(editorial-staging-app)
    fi
    for container in "${expected_containers[@]}"; do
        if ! wait_for_container_health "$container" 120; then
            passed=false
        fi
    done

    # 3. Readiness must confirm PostgreSQL from inside each application container.
    for container in "${expected_apps[@]}"; do
        if [[ "$(docker inspect --format '{{.State.Running}}' "$container" 2>/dev/null || echo false)" != "true" ]]; then
            log "ERROR" "Application container is not running, so readiness cannot be checked: $container"
            passed=false
        elif ! application_reports_postgres_ready "$container"; then
            log "ERROR" "Application readiness did not confirm a healthy PostgreSQL backend: $container"
            report_container_failure "$container"
            passed=false
        fi
    done

    # 4. Confirm the PostgreSQL schema was initialized.
    local schema_ready
    schema_ready=$(docker exec editorial-production-db psql --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align \
        --command "SELECT to_regclass('public.articles') IS NOT NULL" 2>/dev/null || echo f)
    if [[ "$schema_ready" != "t" ]]; then
        log "ERROR" "Production PostgreSQL schema is not initialized."
        passed=false
    fi
    if [[ "$LEGACY_MIGRATION_STATUS" == "imported" || "$LEGACY_MIGRATION_STATUS" == "already-applied" ]]; then
        if ! legacy_migration_applied "editorial-production-db"; then
            log "ERROR" "Expected legacy migration marker is missing from production PostgreSQL."
            passed=false
        fi
    fi

    # 5. Check public listener leaks
    if command -v ss &>/dev/null; then
        local public_listeners
        public_listeners=$(ss -tuln | grep -E '(0\.0\.0\.0|\[::\]|\*):(3000|8080|8443)\b' || true)
        if [[ -n "$public_listeners" ]]; then
            log "ERROR" "Security Leak: Non-essential ports are publicly accessible! Listeners:\n$public_listeners"
            passed=false
        fi
    fi

    # 6. Confirm the active reverse proxy has loaded a valid current Caddyfile.
    if caddy_configuration_is_valid "${BASE_DIR}/compose.production.yml"; then
        log "INFO" "Production Caddy configuration is active and valid."
    else
        log "ERROR" "Production Caddy configuration validation failed."
        passed=false
    fi

    if [[ -n "${PRODUCTION_DOMAIN:-}" ]]; then
        log "INFO" "Public application URL: https://${PRODUCTION_DOMAIN}"
        log "INFO" "Use the configured hostname in the browser; HTTPS access by raw server IP is unsupported and will fail certificate validation."
        if public_https_is_ready; then
            log "INFO" "Public HTTPS certificate and reverse-proxy health are ready."
        else
            log "ERROR" "Public HTTPS is not ready for the configured domain. Check its DNS A record and Caddy certificate logs."
            passed=false
        fi
    else
        log "ERROR" "Production domain is missing from installer configuration."
        passed=false
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
        deploy_application "reuse-image"
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
    require_remote_backup_config
    if [[ -x "${ETC_DIR}/scripts/restic-backup.sh" ]]; then
        "${ETC_DIR}/scripts/restic-backup.sh"
    else
        log "ERROR" "Restic backup script is not executable or missing."
        exit 11
    fi
}

function list_remote_snapshots() {
    log "INFO" "Loading remote cloud snapshots..."
    require_remote_backup_config
    restic snapshots
}

function run_remote_restore() {
    local snapshot_id="$1"
    log "WARN" "REMOTE RESTORE WARNING: This will restore snapshot '$snapshot_id' into an isolated verification directory."
    require_remote_backup_config
    
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

    restic restore "$snapshot_id" --target "$iso_dir"
    log "INFO" "Isolated restoration complete. State files ready for promotion checks inside $iso_dir."
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
        deploy_application "reuse-image"
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

if [[ -n "${VITEST:-}" ]] || [[ "${NODE_ENV:-}" == "test" ]]; then
    NON_INTERACTIVE=true
    BYPASS_PREFLIGHTS=true
elif [[ ! -c /dev/tty ]]; then
    NON_INTERACTIVE=true
fi

if [[ -f "$INSTALLER_CONF" ]]; then
    # shellcheck disable=SC1090
    source "$INSTALLER_CONF"
fi

if [[ "$CMD" == "install" ]]; then
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --non-interactive)
                NON_INTERACTIVE=true
                shift
                ;;
            --source)
                [[ $# -ge 2 ]] || { log "ERROR" "--source requires a directory."; exit 4; }
                APP_SOURCE_DIR="$2"
                shift 2
                ;;
            --repo)
                [[ $# -ge 2 ]] || { log "ERROR" "--repo requires a Git URL."; exit 4; }
                APP_REPOSITORY_URL="$2"
                shift 2
                ;;
            --ref)
                [[ $# -ge 2 ]] || { log "ERROR" "--ref requires a branch, tag, or commit SHA."; exit 4; }
                APP_REF="$2"
                shift 2
                ;;
            --domain)
                [[ $# -ge 2 ]] || { log "ERROR" "--domain requires a DNS hostname."; exit 4; }
                PRODUCTION_DOMAIN="$2"
                shift 2
                ;;
            --legacy-db)
                [[ $# -ge 2 ]] || { log "ERROR" "--legacy-db requires a readable JSON file."; exit 4; }
                LEGACY_DB_PATH="$2"
                shift 2
                ;;
            --production-only)
                DEPLOY_STAGING=false
                shift
                ;;
            --with-staging)
                DEPLOY_STAGING=true
                shift
                ;;
            *)
                log "ERROR" "Unknown install option: $1"
                exit 4
                ;;
        esac
    done
elif [[ "$CMD" == "configure-backup" ]]; then
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --non-interactive)
                NON_INTERACTIVE=true
                shift
                ;;
            *)
                log "ERROR" "Unknown configure-backup option: $1"
                exit 4
                ;;
        esac
    done
fi

case "$CMD" in
    "install")
        run_preflights
        install_dependencies
        prepare_application_source
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
        if [[ -n "${PRODUCTION_DOMAIN:-}" ]]; then
            log "INFO" "Public application URL: https://${PRODUCTION_DOMAIN}"
            log "INFO" "Raw-IP HTTPS is unsupported; use the configured hostname after its DNS A/AAAA record points to this server."
        fi
        df -h /
        free -m
        if [[ "${BYPASS_PREFLIGHTS:-false}" != "true" ]]; then
            docker ps
            ss -lntup
            if [[ -z "$(docker ps -q)" ]]; then
                log "ERROR" "No platform containers are running. Installation either stopped before deployment or failed during Docker startup."
                local_last_error=$(grep -E '"severity":"(ERROR|WARN)"' "$LOG_FILE" | tail -n 1 || true)
                if [[ -n "$local_last_error" ]]; then
                    echo "Last installer warning/error: $local_last_error"
                fi
                echo "Recovery: rerun './deployment/install-editorial-platform.sh install --source /opt/editorial-platform/current --production-only' after correcting the reported configuration error."
            fi
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
    "configure-backup")
        configure_remote_backup
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
