# Staging Deployment Runbook

Staging acts as an isolated sandbox mirroring production.

---

## 1. Staging Scope & Restrictions

*   **WordPress Scope**: Only targets the staging WordPress sandbox instance. Production publishing is strictly blocked.
*   **Billing Caps**: Enforces strict daily and monthly budget ceilings to avoid expensive third-party model consumption.
*   **Public Access**: Staging runs on port `8080` (HTTP) or `8443` (HTTPS) via Caddy.
*   **Network Sandbox Isolation**: Staging containers are completely isolated on `editorial-staging-internal` and `editorial-staging-proxy` bridge networks, with no logical paths or shared sockets to production services.
*   **Service Durability**: Controlled via systemd templates (`/etc/editorial-platform/templates/editorial-platform-staging.service.tmpl`) which configure auto-recovery parameters (`Restart=always`, `RestartSec=10`, `LimitNOFILE=65535`).

---

## 2. Deploying Staging Manually

Run the following commands on the staging instance:
```bash
cd /opt/editorial-platform/current
git checkout dev
sudo ./deployment/install-editorial-platform.sh install --non-interactive
sudo ./deployment/install-editorial-platform.sh verify
```
To run end-to-end publishing tests in staging safely:
```bash
# Verify system metrics and telemetry
sudo ./deployment/install-editorial-platform.sh status
```
