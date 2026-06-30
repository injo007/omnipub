# Production Deployment Runbook

This runbook guides engineers through deploying and promoting releases to the production tier.

---

## 1. Secrets and Credentials Isolation

Production uses isolated keys stored securely inside `/etc/editorial-platform/production.env` with owner-only access permissions (`chmod 600`).

*   **Production Database**: Dedicated production Firebase Project ID and credentials vault.
*   **Production WordPress**: Dedicated domain and secure Application Password.
*   **Production Models**: High-throughput dedicated API keys.

---

## 2. Production Deployment Steps

To trigger a new production rollout:

1.  **Draft a GitHub Release**: Create and publish a semantic release tag (e.g., `v1.0.0`).
2.  **Approve Gate**: Ensure manual approval is completed in GitHub Actions environment gates.
3.  **Deploy Release**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh update --version v1.0.0
    ```
4.  **Post-Rollout Verification**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh verify
    ```
