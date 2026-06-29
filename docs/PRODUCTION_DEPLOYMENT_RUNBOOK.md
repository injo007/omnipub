# PRODUCTION DEPLOYMENT RUNBOOK
## Enterprise Autonomous Editorial Intelligence Platform

This runbook guides operators through deploying, upgrading, and verifying production deployments for the Editorial Intelligence Platform.

---

## 1. Deployment Topology

The platform runs as a containerized Node.js service on **Google Cloud Run**.

```
              ┌────────────────────────┐
              │   Nginx Reverse Proxy  │ (SSL Termination)
              └───────────┬────────────┘
                          │ (Port 3000 Ingress)
              ┌───────────▼────────────┐
              │    Google Cloud Run    │ (SaaS API Gateway)
              └────────────────────────┘
```

### Resource Profile
*   **Engine**: Node.js 20-alpine
*   **Port**: 3000 (Hardcoded routing ingress)
*   **Memory**: 1GB RAM Allocation
*   **CPU**: 1 vCPU with concurrency-scaling rules

---

## 2. Secrets Provisioning

Production variables are retrieved from **Google Cloud Secret Manager** and injected into the container environment.

| Variable Name | Type | Purpose | Verification Pattern |
|---|---|---|---|
| `GEMINI_API_KEY` | Secret | Native Google GenAI SDK | Standard hex string |
| `CREDENTIALS_VAULT_KEY` | Secret | AES-256 Symmetric decryption | Exactly 32 characters |
| `APP_URL` | Config | Public application ingress URL | Must begin with `https://` |

---

## 3. Deployment Pipeline (Staging to Prod)

To execute a secure deployment:

1.  **Continuous Integration**: Push code to the `main` branch. GitHub Actions lints (`tsc --noEmit`), runs unit and integration tests, and builds the frontend bundle.
2.  **Staging Deployment**: Deploy the built Docker image to the staging environment. Run automated smoke tests against the staging WordPress site.
3.  **Approval Gate**: Require two-peer sign-off from senior engineering roles in the release ledger.
4.  **Production Rollout**: Perform a canary release on Cloud Run, shifting 10% traffic incrementally.
5.  **Telemetry Verification**: Monitor the `unauthorized_requests` and `WP_AUTH_FAILURES` metrics for 5 minutes. If elevated errors are detected, roll back immediately to the previous image tag.
