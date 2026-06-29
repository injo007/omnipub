# Enterprise Autonomous Editorial Intelligence Platform
## Deployment Readiness & Configuration Specification

This document details the secure environment configuration, validated secrets schema, and production deployment topology for the Editorial Intelligence Platform.

---

## 1. Environment Separation Strategy

To ensure absolute safety and prevent cross-contamination, the platform operates on distinct staging tiers. Each tier runs completely independent resources:

| Staging Tier | Purpose | Database (Firestore) | Secrets Provider | Base Domain |
|---|---|---|---|---|
| **local** | Sandbox Developer Environment | Local Emulator | Dotenv `.env` file | `localhost:3000` |
| **test** | Automated CI Pipelines | Mock Memory / Local Emulator | Secret env variables | CI Runtime |
| **development**| Shared dev sandbox | GCP Project: `dev-editorial` | Secret Manager | `dev.editorial-saas.com`|
| **staging** | Feature-complete verification | GCP Project: `stage-editorial` | Secret Manager | `staging.editorial-saas.com`|
| **production** | Direct remote WordPress publishing| GCP Project: `prod-editorial` | GCP Secret Manager / KMS | `app.editorial-saas.com`|

---

## 2. Environment Schema Validation

Runtime environment parameters are validated strictly at application startup. Any missing or malformed production configuration immediately blocks startup.

### Required Fields
*   `NODE_ENV`: Must match `local | test | development | staging | production`.
*   `GEMINI_API_KEY`: Required in staging/production. Checked for standard placeholder values.
*   `APP_URL`: Must use `https://` protocol in staging/production.
*   `CREDENTIALS_VAULT_KEY`: Exactly 32-character key for database credential encryption.

---

## 3. Secrets Management Policy

*   **Zero Leakage**: Server credentials (API keys, service accounts, database keys) are never written to Firestore, Git repositories, frontend source codes, or plain text log outputs.
*   **Storage**: Kept in GCP Secret Manager and mounted as environment variables at the container execution boundary.
*   **In-Transit**: Remote credentials for WordPress APIs are symmetrically encrypted using AES-256-GCM under `CREDENTIALS_VAULT_KEY` before being persisted in Firestore or cache files.

---

## 4. Production Topology

The platform utilizes a containerized microservices architecture deployed to **Google Cloud Run** to maximize scalability and cost-efficiency:

```
              ┌────────────────────────┐
              │   Nginx Reverse Proxy  │
              └───────────┬────────────┘
                          │ (Port 3000 Ingress)
              ┌───────────▼────────────┐
              │    Google Cloud Run    │ (SaaS API Gateway)
              └───────────┬────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│   Admin Worker   │              │  Job Orchestrator│ (Cron Loops)
│ (Lease Manager)  │              │ (Publish Queue)  │
└──────────────────┘              └──────────────────┘
```

### Container Configuration
*   **Base Image**: `node:20-alpine` (Minimalistic security footprint).
*   **Memory Limit**: 1GB RAM ceiling.
*   **CPU Allocation**: 1 vCPU with scale-to-zero capabilities enabled in non-peak hours.
*   **Ingress Routing**: Port 3000 exposed via TLS-terminated load balancer.

---

## 5. CI/CD Deployment Pipeline

1.  **Stage 1: Build & Verify**: Lints TypeScript, runs `tsc --noEmit`, and bundles compilation.
2.  **Stage 2: Static Security Scan**: Checks for dependency vulnerabilities (npm audit).
3.  **Stage 3: Testing suite**: Executes all unit, integration, and security test files.
4.  **Stage 4: Staged Release**: Builds production Docker image and pushes to Google Artifact Registry. Deploys to staging first, performs automated smoke testing, and requires manual approval before rolling update to production replicas.
