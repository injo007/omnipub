# MONITORING & ALERTING SPECIFICATION
## Enterprise Autonomous Editorial Intelligence Platform

This specification details telemetry tracking metrics, logging keys, and alert thresholds for the Editorial Intelligence Platform.

---

## 1. Structured Logging Schemas

Logs in production are written as structured, single-line JSON strings to stdout/stderr.

```json
{
  "timestamp": "2026-06-29T14:47:00.000Z",
  "severity": "ERROR",
  "message": "Tracked Secure Error [WORDPRESS_API_FAIL]: Access denied.",
  "environment": "production",
  "service": "WordPressPublisher",
  "errorClass": "Error"
}
```

---

## 2. Alerts Matrix

| Alert Identifier | Severity | Trigger Criteria | Mitigation Protocol | Runbook Link |
|---|---|---|---|---|
| `DEAD_LETTER_GROWTH` | **CRITICAL** | `dead_letter_jobs > 0` | Inspect task parameters and WordPress API endpoint connectivity. | `DLQ_recovery.md` |
| `RECONCILIATION_BACKLOG` | **WARN** | `reconciliation_backlog > 5` | Validate background cron, database capacity, and API latency. | `reconciliation.md` |
| `WP_AUTH_FAILURES` | **CRITICAL** | `auth_failures >= 3 in 1m` | Engage WordPress site kill switch to halt task execution. | `auth_failure.md` |
| `BUDGET_CEILING_WARN` | **WARN** | `spend >= 80% monthly_budget` | Transition pipeline to `Cheap` tier to limit API token consumption. | `cost_control.md` |
| `BUDGET_HARD_STOP` | **CRITICAL** | `spend >= 100% monthly_budget` | Automatically abort any subsequent API drafts or crawls. | `cost_control.md` |

---

## 3. High-Cardinality & Redaction Policies

*   **URL Hashing**: High-cardinality values, such as custom scraper URLs, are sanitized or hashed to prevent metrics database explosion.
*   **API Key Redaction**: Keys matching `api_key`, `password`, `secret`, `token` are recursively scrubbed from all logged context objects.
*   **Prompt Body Truncation**: Complete prompt payloads and article HTML drafts are stripped from logs to prevent data leakage and keep log size below 500 characters.
