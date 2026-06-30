# One-File Installation & Upgrade Runbook

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

1.  **Clone code repository or download release artifacts**:
    ```bash
    git clone https://github.com/injo007/omnipub.git /opt/editorial-platform/current
    cd /opt/editorial-platform/current
    ```

2.  **Make master installer script executable**:
    ```bash
    chmod +x deployment/install-editorial-platform.sh
    ```

3.  **Execute setup workflow**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh install
    ```

4.  **Confirm status and service telemetry**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh status
    sudo ./deployment/install-editorial-platform.sh verify
    ```

---

## 4. Production-Ready System Integrations

### A. Network Isolation Model
The master installer configures four isolated Docker bridge networks to guarantee staging and production container environments never cross-talk or share routes:
-   **`editorial-production-internal`**: Dedicated to the production application and production database connections.
-   **`editorial-production-proxy`**: Bridges the production front-facing Caddy edge server and external internet endpoints.
-   **`editorial-staging-internal`**: Sandbox-only internal app network.
-   **`editorial-staging-proxy`**: Front-facing Caddy routing for staging endpoints.

### B. Systemd Daemon Integration
To ensure absolute service persistence, self-healing, and concurrency limits across worker processes, the platform installs Systemd service templates under `/etc/editorial-platform/templates/` utilizing these parameters:
-   `Restart=always`: Automates instant service recovery upon container or engine crash.
-   `RestartSec=10`: Spreading engine restarts safely to prevent crash-loops.
-   `LimitNOFILE=65535`: Sets file descriptors to high limits to support highly concurrent queue workers.

