# INCIDENT RESPONSE RUNBOOK
## Enterprise Autonomous Editorial Intelligence Platform

This incident response runbook outlines diagnostics, triage workflows, and mitigations for production-grade incidents on the Editorial Intelligence Platform.

---

## 1. Alert Escalation Paths

When a critical monitoring alert is fired, operations are notified immediately:

| Severity | Target SLA | Notification Target | Primary Escalation |
|---|---|---|---|
| **WARN** | 12 Hours | Slack / Telemetry Logging | Senior On-Call Engineer |
| **CRITICAL** | 1 Hour | PagerDuty / SMS | Systems Administrator |

---

## 2. Standard Runbooks for Active Incidents

### Incident A: `DEAD_LETTER_GROWTH` (Critical)
*   **Symptom**: Unhandled publishing job failures are routing to the Dead-Letter Queue (DLQ).
*   **Diagnostic**: Run the query `db.collection('jobs').where('status', '==', 'dead-letter')` to check affected documents.
*   **Mitigation**:
    1.  Inspect the `errorClass` and sanitized error message.
    2.  Check remote WordPress connection status and credentials validity.
    3.  If credentials are leaked, revoke immediately and regenerate.

### Incident B: `RECONCILIATION_BACKLOG` (Warning)
*   **Symptom**: Jobs are piling up in the reconciliation queue waiting for state verification.
*   **Diagnostic**: Check worker concurrency and processing rate.
*   **Mitigation**:
    1.  Temporarily increase `WORKER_CONCURRENCY` (up to maximum 20).
    2.  Check for network delays or slow responses from remote WordPress APIs.

### Incident C: `WP_AUTH_FAILURES` (Critical)
*   **Symptom**: Repeated failed attempts to connect to remote WordPress sites.
*   **Diagnostic**: View the structured logs for the specific site ID.
*   **Mitigation**:
    1.  Enable the site-specific kill switch (`disabledWordPressSites: [siteId]`) to halt job execution targeting that domain.
    2.  Contact site owner to check XML-RPC or Application Passwords.
