# Autonomous Editorial Intelligence Platform for WordPress

A highly resilient, full-stack enterprise publishing suite designed specifically for WordPress publishers. The system operates autonomously to discover content opportunities, research/verify factual grounds, draft high-quality brand-safe articles, and publish them directly to remote WordPress sites.

---

## 🚀 Quick Start & Installation

To install the platform on a fresh physical or virtual Linux server, follow these quick-start steps:

### 1. Requirements & Sizing
*   **Host OS**: Ubuntu Server 24.04 LTS (x86_64)
*   **Permissions**: Strict `sudo` or `root` privileges.
*   **Production-only minimum**: 1 vCPU, 2 GB RAM, 40 GB available disk. This profile uses reduced worker concurrency and does not start staging.
*   **Production + staging minimum**: 4 vCPU, 8 GB RAM, 80 GB available disk.
*   **Recommended sizing**: 8 vCPU, 16 GB RAM, 160 GB NVMe SSD.
*   **Model credential**: `OPENROUTER_API_KEY` (recommended) or `MINIMAX_API_KEY` is required. PostgreSQL and credential-vault secrets can be generated securely by the installer.
*   **Remote backup credentials**: Optional. Restic and AWS credentials are configured after installation only if remote backups are wanted.

### 2. Standard Installation Steps
Execute the following commands on your server:

```bash
# 1. Clone the repository
git clone https://github.com/injo007/omnipub.git /opt/editorial-platform/current
cd /opt/editorial-platform/current

# 2. Grant execution permissions to the master installer
chmod +x deployment/install-editorial-platform.sh

# 3. Launch the secure, automated installation
sudo ./deployment/install-editorial-platform.sh install \
  --source /opt/editorial-platform/current
```

The installer automatically uses production-only mode on smaller hosts. To choose explicitly:

```bash
sudo ./deployment/install-editorial-platform.sh install \
  --source /opt/editorial-platform/current \
  --production-only
```

The application installation does not ask for Restic or AWS credentials. Configure encrypted remote backups later, without reinstalling the application:

```bash
sudo ./deployment/install-editorial-platform.sh configure-backup
```

For the first PostgreSQL cutover from an existing local snapshot:

```bash
sudo ./deployment/install-editorial-platform.sh install \
  --source /opt/editorial-platform/current \
  --production-only \
  --legacy-db /opt/editorial-platform/current/db.json
```

### 3. Verify & Monitor Service Health
Once the installer has completed, execute these commands to run acceptance checks:

```bash
# Verify system metrics and running containers
sudo ./deployment/install-editorial-platform.sh status

# Run the complete post-installation verification suite
sudo ./deployment/install-editorial-platform.sh verify
```

## Installation recovery and previously observed failures

The installer is resumable. Pressing `Ctrl+C`, losing an SSH session, or correcting a configuration error does not remove PostgreSQL volumes or completed setup work. Rerun the same `install` command to continue.

### `Configure OPENROUTER_API_KEY or MINIMAX_API_KEY`

Older installer behavior exited after a blank model-key prompt, leaving no containers or deployment metadata. The current installer repeats the secure prompt in interactive mode and provides a recovery message in non-interactive mode. Set one of these variables before a non-interactive installation:

```bash
export OPENROUTER_API_KEY="your-key"
# Or: export MINIMAX_API_KEY="your-key"
```

Do not put API keys directly in shell history on shared systems. Prefer a hidden `read -s` prompt or the interactive installer.

### Website times out and `docker ps` is empty

This means installation stopped before deployment; it is not a WordPress or browser error. Check the redacted installer log and resume:

```bash
sudo tail -n 150 /var/log/editorial-platform/installer.log
sudo ./deployment/install-editorial-platform.sh status
sudo ./deployment/install-editorial-platform.sh install \
  --source /opt/editorial-platform/current \
  --production-only
```

The `verify` command now reports missing containers immediately instead of waiting through repeated health-check timeouts.

### `CREDENTIALS_VAULT_KEY must contain exactly 32 characters`

This could occur after an interrupted older installation saved a malformed key. On an incomplete deployment with no deployment metadata, the installer now replaces that invalid value with a generated 32-character key and resumes. If a completed deployment exists, it refuses automatic rotation to protect credentials already encrypted with the existing key.

Remote backup input is no longer part of application installation. Leaving AWS or Restic unset cannot stop deployment. Configure it later with:

```bash
sudo ./deployment/install-editorial-platform.sh configure-backup
```

AWS access keys are optional when Restic uses an instance role or a non-S3 authentication method. The Restic repository and encryption password are required only when remote backup is enabled.

### Application is unhealthy and `Production PostgreSQL schema is not initialized`

Older deployment ordering allowed the application container to be responsible for creating the PostgreSQL schema during its first boot. A startup failure could therefore leave both an empty schema and a restart loop. The installer now runs a dedicated one-shot schema bootstrap before starting the application, verifies the required tables, waits for container health, and confirms PostgreSQL readiness before recording successful deployment metadata.

Pull the corrected installer and rerun the same installation command. PostgreSQL volumes are preserved and `CREATE TABLE IF NOT EXISTS` makes schema bootstrap safe to repeat:

```bash
sudo ./deployment/install-editorial-platform.sh install \
  --source /opt/editorial-platform/current \
  --production-only
```

If startup still fails for a different reason, the installer now records the container exit code, OOM status, restart count, and the last 120 container log lines in `/var/log/editorial-platform/installer.log`.

### Direct IP address does not open the site

Caddy uses the production domain configured during installation. Point that domain's DNS `A` record to the server, allow ports 80 and 443, and open the domain rather than the raw server IP.

---

## 🛡️ Production-Ready Infrastructure

The deployment system is highly hardened and preconfigured for enterprise workloads:

### A. Network Perimeter Isolation
Staging and production containers run on fully isolated Docker bridge networks to eliminate cross-talk or route leaks:
*   **`editorial-production-internal`**: Dedicated internal app and database connection bridge.
*   **`editorial-production-proxy`**: Front-facing proxy network bridging Caddy and outer endpoints.
*   **`editorial-staging-internal`**: Isolated internal staging sandbox app bridge.
*   **`editorial-staging-proxy`**: Front-facing proxy network for staging.

### B. Systemd Service Integration
To guarantee high-throughput queue durability and self-healing, Systemd configuration templates are generated inside `/etc/editorial-platform/templates/` utilizing:
*   `Restart=always`: Instant daemon revival upon node crash.
*   `RestartSec=10`: Backoff delay preventing CPU starvation during transient failures.
*   `LimitNOFILE=65535`: Large file descriptor limits to support highly concurrent queue workers.

---

## 🤖 Editorial Agent Architecture

The workspace is powered by a coordinated council of specialized cognitive agents:
1.  **RSS Catalog & Crawl Engine**: Constantly active feed ingestion.
2.  **Fingerprinted Deduplication Engine**: Sanitizes incoming leads using alphanumeric string-distance fingerprinting.
3.  **Article Opportunity Scoring Engine**: Evaluates item quality via a 9-Point Weighted Scoring formula.
4.  **Fact-Checker & Research Agent**: Compiles structured, verified reference payloads.
5.  **Strategic SEO Architect**: Calculates optimal slugs, target densities, and RankMath search quality guidelines.
6.  **Brand Voice Writer Agent**: Composes original editorial drafts matching custom publication profiles.
7.  **Natural Style Editor**: Audits draft flows to remove digital markers and ensure fluid editorial style.
8.  **Lead Quality & Safety Auditor**: Inspects completed work against safety policies (trademark risk, fake quote prevention, etc.).
9.  **Visual Media Director**: Performs clean public domain/accredited image asset matching.
10. **WordPress SEO Publisher Agent**: Pushes block HTML, metadata, and handles categories/tags via REST APIs.
11. **Cost & Usage Audit Engine**: Analyzes and logs token-by-token resource consumption dynamically.

---

## 📖 Deployment Documentation

Detailed runbooks are available in the repository root for advanced operational guides:
*   **[Installation Runbook](./INSTALLATION_RUNBOOK.md)**: Detailed operating system targets and custom setups.
*   **[Staging Deployment Runbook](./STAGING_DEPLOYMENT_RUNBOOK.md)**: Sandbox boundaries, billing caps, and port mappings.
*   **[Production Deployment Runbook](./PRODUCTION_DEPLOYMENT_RUNBOOK.md)**: Secrets isolation, promotion gates, and release tags.
*   **[Backup & Restore Runbook](./BACKUP_RESTORE_RUNBOOK.md)**: Encrypted restic automated schedules and snapshots.
