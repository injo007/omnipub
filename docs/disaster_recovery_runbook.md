# Enterprise Autonomous Editorial Intelligence Platform
## Disaster Recovery, Backup, & Stateful Reconciliation Runbook

This runbook documents backup configurations, restore procedures, stateful reconciliation drills, and disaster failover scenarios for the Editorial Intelligence Platform.

---

## 1. Backup Strategy

To prevent database corruption and data loss, the platform relies on automated, multi-tiered backups:

*   **Firestore Backup**: Automated daily exports of Firestore collections scheduled via Cloud Scheduler and written securely to standard GCP Cloud Storage buckets (`gs://editorial-prod-backups`).
*   **Local DB Cache**: Systematically flushed to disk on server shutdown and synchronizes periodically back to Firestore to ensure absolute convergence.
*   **Retention Period**: Backups carry a rigid 30-day retention period before lifecycle rules purge expired files.

---

## 2. Recovery Procedures (Restore Drills)

To perform a database restore from Cloud Storage back into production Firestore:

1.  **Step 1: Inhibit Production Write Access**: Place the server in emergency lock down using the features/kill-switch system to halt incoming jobs and worker leases.
2.  **Step 2: Authenticate GCP Session**: Ensure your CLI environment is authorized on the target project.
3.  **Step 3: Trigger Import Command**:
    ```bash
    gcloud firestore import gs://editorial-prod-backups/[BACKUP_TIMESTAMP]/
    ```
4.  **Step 4: Verify Collection State**: Query the `saas` collection to confirm schema and document integrity are intact.
5.  **Step 5: Lift Inhibits**: Gradually restore worker tasks to resume publishing operations.

---

## 3. Stateful Reconciliation & Interrupted Jobs

When a background worker execution is abruptly interrupted (e.g., container crashing, SIGKILL during a remote API request):

*   **Lease Expiration Guard**: Each lease is bound by a strict lease duration (default: 60s). When a worker fails to renew, the lease automatically expires.
*   **Automatic Cleanup**: Background orchestrators detect orphaned jobs (status: `leased` or `EXECUTING` with expired lease times).
*   **Resolution Protocol**:
    1.  Orphaned jobs are transitioned back to `queued` to allow standard lease retry.
    2.  If the job has failed remote publishing due to ambiguous API outcomes, it is routed to the Reconciliation Queue.
    3.  If the reconciliation engine cannot guarantee double-post prevention, the job is moved to `reconciliation_required` or `dead-letter` for human audit.

---

## 4. Disaster Failover Scenarios

### Scenario A: Firestore Regional Outage
*   **Impact**: Loss of real-time state synchronizations.
*   **Action**: The server automatically transitions to **Local Cache Fallback**. Reads and writes are buffered locally in the `db.json` cache file. When Firestore regional connectivity recovers, a background sync reconciles local state changes with Firestore collections using a last-write-wins priority.

### Scenario B: WordPress API Rate-Limiting / Block
*   **Impact**: Worker leases fail with HTTP 429 or 403 on target WordPress sites.
*   **Action**: The system engages the site-specific kill-switch automatically, halting further job executions targeting that site. Retrying jobs are safely pushed back to the queue with exponential backoff.

### Scenario C: Gemini API Quota Exhaustion
*   **Impact**: Inability to draft or edit longform opportunities.
*   **Action**: If the native Gemini API returns status `429` (Quota Ceiling), the platform’s model router automatically fallback-routes subsequent drafting and editing requests to alternative backup providers (e.g., OpenRouter Llama/DeepSeek gateways).
