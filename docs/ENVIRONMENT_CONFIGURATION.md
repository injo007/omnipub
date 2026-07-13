# ENVIRONMENT CONFIGURATION SPECIFICATION
## Enterprise Autonomous Editorial Intelligence Platform

This document defines variables, schemas, and verification parameters for setting up and running the Editorial Intelligence Platform.

---

## 1. Environment Schemas

Runtime configuration variables are parsed and validated strictly at application boot using Zod-based schemas defined in `server/editorial/environmentService.ts`.

| Key Name | Required | Allowed Values | Default Value | Description |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `local`, `test`, `development`, `staging`, `production` | `local` | Primary application operational environment staging tier. |
| `GEMINI_API_KEY` | No | Secret API key string | - | Google GenAI credentials for server-side processing. |
| `CREDENTIALS_VAULT_KEY`| Yes | 32-character string | - | Key for AES-256 GCM encryption of remote credentials. |
| `APP_URL` | No | HTTPS URL | - | Secure application URL for origin verification. |
| `WORKER_CONCURRENCY`| No | 1 to 20 | `5` | Number of concurrent worker jobs. |
| `WORKER_LEASE_DURATION_SEC`| No | 5 to 300 | `60` | Duration of active worker leases before timeout. |
| `MAX_PUBLISHING_RETRIES`| No | 1 to 10 | `5` | Maximum job retry limit. |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Yes in staging/production | PostgreSQL connection values | - | Required database connection. |
| `POSTGRES_REQUIRED` | Yes in staging/production | `true` | - | Fails startup if PostgreSQL cannot be used. |

---

## 2. Boot Restrictions

When running in `production` mode, the environment validator enforces the following rules:
*   `OPENROUTER_API_KEY` or `MINIMAX_API_KEY` must be configured for MiniMax-M3.
*   `APP_URL` must be configured and utilize a secure `https://` protocol.
*   Wildcard CORS headers are strictly disabled.
*   PostgreSQL credentials and a 32-byte credential-vault key are mandatory.
