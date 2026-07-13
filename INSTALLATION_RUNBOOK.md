# Ubuntu 24.04 Installation & Upgrade Runbook

This document defines installation workflows for operators setting up fresh physical or virtual Linux servers.

---

## 1. Operating System Targets

*   **Supported Host OS**: Ubuntu Server 24.04 LTS (x86_64 minimal / standard)
*   **Permissions**: Strict `sudo` or root privileges required.

## 2. Server Sizing

| Category | Recommended Capacity | Minimum Capacity (Fail Ceiling) |
|---|---|---|
| **CPU Cores** | 8 Cores (vCPU) | 4 Cores |
| **RAM Space** | 16 GB DDR4/DDR5 | 8 GB |
| **Storage NVMe**| 160 GB NVMe | 80 GB SSD |

---

## 3. Fresh Installation Procedure

1.  **Clone the repository for a local-source installation**:
    ```bash
    git clone https://github.com/injo007/omnipub.git /opt/editorial-platform/current
    cd /opt/editorial-platform/current
    ```

2.  **Make master installer script executable**:
    ```bash
    chmod +x deployment/install-editorial-platform.sh
    ```

3.  **Execute setup workflow**. Include `--legacy-db` during the first PostgreSQL cutover when an existing snapshot must be imported:
    ```bash
    sudo ./deployment/install-editorial-platform.sh install \
      --source /opt/editorial-platform/current \
      --legacy-db /secure/export/db.json
    ```

    A standalone copy of the installer can fetch and stage a release itself:

    ```bash
    sudo ./install-editorial-platform.sh install \
      --repo https://github.com/injo007/omnipub.git \
      --ref main
    ```

    Use a release tag or commit SHA instead of `main` for a reproducible production installation.

4.  **Confirm status and service telemetry**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh status
    sudo ./deployment/install-editorial-platform.sh verify
    ```

---

## 4. Production-Ready System Integrations

### A. Database Isolation Model (Self-Hosted PostgreSQL)
The platform uses a local, self-contained PostgreSQL instance running alongside the application. No cloud database service is required.
-   **Ordered Migration & Schema Setup**: The installer starts PostgreSQL before the application. If `--legacy-db` is supplied and PostgreSQL is empty, a dedicated migration container creates the schema, imports the snapshot, and writes a durable migration marker. The application starts only after this succeeds. Reruns never overwrite populated PostgreSQL tables.
-   **Deterministic Build Context**: Source is staged under `/opt/editorial-platform/current` and validated before Docker builds it. Environment files, repository metadata, and `db.json` are excluded from the image build context.
-   **Security Configuration**: PostgreSQL credentials are stored in root-readable environment files (`0600`). WordPress secrets are encrypted by the 32-byte `CREDENTIALS_VAULT_KEY` before persistence.

### B. Network Isolation Model
The master installer configures four isolated Docker bridge networks to guarantee staging and production container environments never cross-talk or share routes:
-   **`editorial-production-internal`**: Dedicated to the production application and production database connections.
-   **`editorial-production-proxy`**: Bridges the production front-facing Caddy edge server and external internet endpoints.
-   **`editorial-staging-internal`**: Sandbox-only internal app network.
-   **`editorial-staging-proxy`**: Front-facing Caddy routing for staging endpoints.

### C. Systemd Daemon Integration
To ensure absolute service persistence, self-healing, and concurrency limits across worker processes, the platform installs Systemd service templates under `/etc/editorial-platform/templates/` utilizing these parameters:
-   `Restart=always`: Automates instant service recovery upon container or engine crash.
-   `RestartSec=10`: Spreading engine restarts safely to prevent crash-loops.
-   `LimitNOFILE=65535`: Sets file descriptors to high limits to support highly concurrent queue workers.
