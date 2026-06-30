# Next Steps Operator Roadmap

This document summarizes the exact steps required to complete the go-live phase of the Autonomous Editorial Intelligence Platform.

---

## 1. Local Code Completion Check

Before transferring configurations:
1.  **Run All Tests**:
    ```bash
    npx vitest run
    ```
2.  **Verify Types and Lint**:
    ```bash
    npx tsc --noEmit
    npm run lint
    ```
3.  **Confirm Build Stability**:
    ```bash
    npm run build
    ```

---

## 2. Server Setup and Deployment

1.  **Host Machine Provisioning**: Set up a fresh machine with **Ubuntu 24.04 LTS**.
2.  **Clone Source**:
    ```bash
    git clone https://github.com/injo007/omnipub.git /opt/editorial-platform/current
    cd /opt/editorial-platform/current
    ```
3.  **Execute Platform Install**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh install
    ```
4.  **Staging End-to-End Validation**: Verify staging pipeline executions before pushing to production.
5.  **Backup Verification**: Verify backups are regularly scheduled and local/remote backups are complete.
