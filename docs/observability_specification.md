# Enterprise Autonomous Editorial Intelligence Platform
## Observability & Security Auditing Specification

This specification defines structured logging keys, metrics tracking schemas, alerting thresholds, and error redaction policies for production-grade telemetry.

---

## 1. Structured Logging Standard

All logs written in production are output as structured, single-line JSON strings to stdout/stderr. This allows centralized search and indexing tools (such as Cloud Logging, Datadog, or Elasticsearch) to parse telemetry seamlessly.

### Mandatory Keys
*   `timestamp`: ISO 8601 UTC time.
*   `severity`: `DEBUG | INFO | WARN | ERROR | CRITICAL`.
*   `message`: Clean, literal, human-readable log summary.
*   `environment`: Matches `process.env.NODE_ENV`.
*   `component`: The specific service block (e.g., `PublishingQueueService`, `WordPressPublisher`).
*   `requestId`: Correlated ID for tracking API requests.
*   `articleId` / `packageId` / `publishingJobId`: Context IDs for content assets.

---

## 2. Telemetry Metrics Matrix

The system tracks metrics across four core operational categories:

### A. Pipeline Opportunities
*   `articles_ingested`: Cumulative crawled items.
*   `duplicate_sources_rejected`: Alphanumeric distance collisions.
*   `phase_c_pass | phase_c_repair | phase_c_block`: Editorial brief verification success.
*   `phase_d_approved | phase_d_manual_review`: Immutable package safety output.

### B. Publishing Queue Operations
*   `jobs_queued`: Inserted tasks.
*   `jobs_published | jobs_updated`: Completed publishing updates.
*   `jobs_retrying`: Exponential retry iterations.
*   `jobs_requiring_reconciliation`: Interrupted task recovery triggers.
*   `dead_letter_jobs`: Terminal failures held for manual resolution.
*   `lease_recovery_count`: Leases broken due to worker crashes.

### C. AI Resource Tracking
*   `provider_calls`: Count divided by model ID and vendor.
*   `token_usage_input | token_usage_output`: Detailed prompt tokens.
*   `estimated_cost_usd`: Estimated budget expenditure.
*   `fallback_usage`: Count of model fallback redirections.

### D. Security Audits
*   `unauthorized_requests`: Blocked authentication attempts.
*   `rate_limit_blocks`: Throttled client requests.
*   `invalid_schema_requests`: Malformed body payloads.
*   `firestore_rule_denials`: Denied Client writes.

---

## 3. Alerts & Incident Management

| Alert Identifier | Severity | Trigger Criteria | Recommended Mitigations | Runbook Target |
|---|---|---|---|---|
| `DEAD_LETTER_GROWTH` | **CRITICAL** | `dead_letter_jobs > 0` | Inspect task parameters, remote WP configurations, and verify target credential status. | `/docs/runbooks/DLQ_recovery.md` |
| `RECONCILIATION_BACKLOG` | **WARN** | `reconciliation_backlog > 5` | Validate background workers, check target site connection, evaluate load. | `/docs/runbooks/reconciliation.md` |
| `WP_AUTH_FAILURES` | **CRITICAL** | `auth_failures >= 3 in 1m` | Revoke and cycle application keys. Verify user permissions on target WP site. | `/docs/runbooks/auth_failure.md` |
| `BUDGET_CEILING_WARN` | **WARN** | `spend >= 80% monthly_budget` | Transition pipeline to `Cheap` tier. Audit top resource-consuming feeds. | `/docs/runbooks/cost_control.md` |
| `FIRESTORE_FAILURE` | **CRITICAL** | `database_error >= 5 in 1m` | Verify GCP regional status. Check Firebase IAM permissions. | `/docs/runbooks/firestore_outage.md` |

---

## 4. Error Redaction & Context Filtering

To prevent security breaches, all errors and exception traces undergo automatic sanitization before logging:
*   **API Key Redaction**: Regular expressions strip hex strings and base64 signatures matching model API token patterns.
*   **Credentials Filter**: Field filters remove values for keys containing `password`, `token`, `secret`, `cookie`, `credentials`, or `auth`.
*   **Payload Truncation**: Overly long message bodies, complete prompt templates, and raw scraped source texts are truncated to a maximum of 500 characters.
