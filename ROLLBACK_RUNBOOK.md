# Production Emergency Rollback Runbook

This document details emergency rollback triggers, image swap techniques, and data protection strategies.

---

## 1. Rollback Strategy & Triggers

A rollback must be initiated when any of the following occur:
1.  **Elevated Error Rate**: API endpoint status codes return > 5% 5xx errors for a 5-minute window following a release.
2.  **Worker Failures**: Background worker lease errors rise significantly.
3.  **WordPress Outages**: Connection authentications fail across all endpoints.

---

## 2. Executing Rollback

The rollback flow must be executed via the master installer:
```bash
sudo ./deployment/install-editorial-platform.sh rollback
```

### Action Chain
1.  **Stop New Tasks**: Pauses queue operations.
2.  **Verify Previous Archive**: Locates the latest backup archive.
3.  **Perform Restore**: Re-installs previous environment configuration and restarts Docker stacks using the previous stable image digest.
4.  **Confirm Operation**: Runs `./install-editorial-platform.sh verify` to check container health.
5.  **Audit Survival**: Verifies that existing publishing jobs, packages, and audit ledger records remain completely unaffected.
