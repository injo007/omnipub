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

*   **`CREDENTIALS_VAULT_KEY`**: Strict 32-character hexadecimal key used to encrypt and decrypt sensitive remote WordPress credentials in Firestore.
