# Environment Configuration Reference

This guide summarizes all environment variable configurations, validation constraints, and secure initialization guidelines.

---

## 1. System Variables

*   **`NODE_ENV`**: Mode of execution. Must be `production` or `staging` on self-hosted instances.
*   **`PORT`**: Network port of the Node.js process (set to `3000` inside containers).
*   **`APP_URL`**: Public-facing canonical endpoint (e.g., `https://editorial.example.com`).

## 2. API Keys and Provider Secret Credentials

*   **`GEMINI_API_KEY`**: Native Google GenAI integration credentials.
*   **`OPENROUTER_API_KEY`**: Gateway integration for third-party models.
*   **`MINIMAX_API_KEY`**: Gateway connection key.

## 3. Cryptography Keys

*   **`CREDENTIALS_VAULT_KEY`**: Exactly 32 bytes; encrypts sensitive WordPress credentials before PostgreSQL persistence.

## 4. PostgreSQL

* **`PGHOST`**: `db` in Docker Compose; a hostname or socket host for direct deployment.
* **`PGPORT`**: PostgreSQL port, normally `5432`.
* **`PGDATABASE`**, **`PGUSER`**, **`PGPASSWORD`**: Database name and credentials.
* **`POSTGRES_REQUIRED`**: Set to `true` in staging and production. Startup fails closed if PostgreSQL is unavailable.

Use either `OPENROUTER_API_KEY` or `MINIMAX_API_KEY` for MiniMax-M3. `GEMINI_API_KEY` is optional. `AUTH_REQUIRED=true` enables the self-hosted `APP_API_TOKEN` bearer-token gate.
