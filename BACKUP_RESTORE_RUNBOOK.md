# Backup and Restore Execution Runbook

This runbook specifies automated state backup processes, signature tracking, and database restoration procedures.

---

## 1. Local and Remote Backup Architecture

*   **Local Backups**: Triggered manually or daily via cron:
    ```bash
    sudo /deployment/install-editorial-platform.sh backup
    ```
*   **Encrypted Remote Cloud Backups (Restic)**: Deduplicated and encrypted backups to remote S3, R2, B2 or SFTP repository targets:
    ```bash
    sudo /deployment/install-editorial-platform.sh remote-backup
    ```
*   **Encapsulated Scope**:
    *   Symmetric secrets and configuration variables under `/etc/editorial-platform/`.
    *   State files and JSON database cache `db.json` files.
    *   Docker named volumes.
    *   Deployment metadata and historic logs.

---

## 2. Remote Restic Backup Operations

### 2.1. Listing Cloud Snapshots
To query and inspect available encrypted snapshots from the remote cloud repository:
```bash
sudo /deployment/install-editorial-platform.sh remote-snapshots
```

### 2.2. Pre-Restore Safety Snapshot & Isolated Restoration
To restore a snapshot safely to an isolated temporary directory for contents verification before altering live database folders:
```bash
sudo /deployment/install-editorial-platform.sh remote-restore --snapshot latest
```
This automatically takes a local safety pre-restore backup, runs restic restore to an isolated verification target, and preserves production state until manually promoted.

---

## 3. Local Restore Procedure

1.  **Stop all traffic**: Set the emergency global publishing kill switch to block active write streams.
2.  **Take snapshot**: Force a pre-restore backup.
3.  **Perform restoration**:
    ```bash
    sudo /deployment/install-editorial-platform.sh restore --backup backup_20260629_120000
    ```
4.  **Confirm connectivity and health**:
    ```bash
    sudo /deployment/install-editorial-platform.sh verify
    ```
5.  **Lift kill switches**: Resume background queues.
