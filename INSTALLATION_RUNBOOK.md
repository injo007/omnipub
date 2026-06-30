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
    git clone https://github.com/org/editorial-platform.git /opt/editorial-platform/current
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
