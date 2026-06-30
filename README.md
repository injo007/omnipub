# Autonomous Editorial Intelligence Platform for WordPress

A highly resilient, full-stack enterprise publishing suite designed specifically for WordPress publishers. The system operates autonomously to discover content opportunities, research/verify factual grounds, draft high-quality brand-safe articles, and publish them directly to remote WordPress sites.

---

## 🚀 Quick Start & Installation

To install the platform on a fresh physical or virtual Linux server, follow these quick-start steps:

### 1. Requirements & Sizing
*   **Host OS**: Ubuntu Server 24.04 LTS (x86_64)
*   **Permissions**: Strict `sudo` or `root` privileges.
*   **Recommended Sizing**: 8 vCPU Cores, 16 GB RAM, 160 GB NVMe SSD.

### 2. Standard Installation Steps
Execute the following commands on your server:

```bash
# 1. Clone the repository
git clone https://github.com/injo007/omnipub.git /opt/editorial-platform/current
cd /opt/editorial-platform/current

# 2. Grant execution permissions to the master installer
chmod +x deployment/install-editorial-platform.sh

# 3. Launch the secure, automated installation
sudo ./deployment/install-editorial-platform.sh install
```

### 3. Verify & Monitor Service Health
Once the installer has completed, execute these commands to run acceptance checks:

```bash
# Verify system metrics and running containers
sudo ./deployment/install-editorial-platform.sh status

# Run the complete post-installation verification suite
sudo ./deployment/install-editorial-platform.sh verify
```

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
