# Disaster Recovery Runbook

This guide contains runbooks to restore operational continuity in the event of major system failures.

---

## 1. System Recovery Classifications

*   **Total Host Deletion**: Physical server failure, VM corruption, or cloud provider outage.
*   **Database Corruption**: PostgreSQL data corruption, failed storage volume, or structural ledger failure.
*   **Secrets compromised**: Accidental leak of credentials, requiring key rotation.

---

## 2. Disaster Recovery Action Plan (Total Host Loss)

1.  **Provision Fresh Node**: Start a clean Ubuntu 24.04 VM.
2.  **Restore Directory Layout**: Clone the repository and prepare the directories.
3.  **Restore Backup Archive**: Fetch the latest backup archive from your remote storage.
4.  **Restore Configuration**:
    ```bash
    sudo ./deployment/install-editorial-platform.sh restore --backup <backup-id>
    ```
5.  **Verify & Go Live**: Perform `sudo ./deployment/install-editorial-platform.sh verify` to validate clean container lifecycles.

Backups contain a PostgreSQL custom-format dump created with `pg_dump`. Restore uses `pg_restore --clean --if-exists`, restarts the application, and then runs the installer verification gate.
