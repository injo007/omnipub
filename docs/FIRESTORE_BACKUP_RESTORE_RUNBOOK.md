# FIRESTORE BACKUP & RESTORE RUNBOOK
## Enterprise Autonomous Editorial Intelligence Platform

This runbook documents backup scheduling, restoration pipelines, encryption keys, and recovery verification drills.

---

## 1. Backup Strategy & Parameters

The database utilizes Google Cloud Firestore, backed up automatically to secure Cloud Storage buckets.

*   **Backup Method**: Automated Serverless Cloud Firestore Export
*   **Schedule**: Every night at 02:00 UTC (Via Cloud Scheduler cron `0 2 * * *`)
*   **Destination Bucket**: `gs://editorial-prod-backups-ai-studio`
*   **Retention Policy**: 30-day rolling retention; lifecycle rules purge backups exceeding 30 days automatically.
*   **Encryption**: Google-managed KMS encryption at-rest and in-transit.
*   **Recovery Point Objective (RPO)**: 24 Hours.
*   **Recovery Time Objective (RTO)**: 1 Hour.

---

## 2. Restore Execution Steps

In the event of database corruption or severe state loss, follow these recovery procedures:

1.  **Halt Operations**: Engage the global publishing kill switch (`disableAllPublishing: true`) to freeze incoming write transactions.
2.  **Verify Target Environment**: Ensure the correct target namespace and project identifier are selected to prevent accidental production overwrite.
3.  **Run Restore Import**:
    ```bash
    gcloud firestore import gs://editorial-prod-backups-ai-studio/[BACKUP_FOLDER]/
    ```
4.  **Confirm Collections State**: Run checks to verify documents exist across `articles`, `packages`, `jobs`, and `audit_history` collections.
5.  **Lift Kill Switches**: Resume background workers by setting `disableAllPublishing: false`.

---

## 3. Recovery Verification Drill

To ensure backups are fully restorable:

1.  Create unique, synthetic test records in the development database.
2.  Generate a mock backup export using the Firestore emulator.
3.  Restore the mock backup export into an isolated test namespace (`test_recovery_sandbox`).
4.  Verify that all collections contain matching records and references.
5.  Validate that zero publishing requests or operations leak to production WordPress sites during the drill.
