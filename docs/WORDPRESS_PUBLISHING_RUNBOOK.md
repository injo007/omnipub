# WORDPRESS PUBLISHING RUNBOOK
## Enterprise Autonomous Editorial Intelligence Platform

This runbook specifies guidelines, safety validation gates, and publishing protocols for remote WordPress integrations.

---

## 1. Publishing Connection Requirements

Connecting to remote WordPress sites requires absolute security and encryption to protect administrative access:

*   **SSL Protocol Strictness**: All remote WordPress target URLs must use `https://` protocol schema. Secure sockets prevent sniffing of API credentials.
*   **Authentication Mechanism**: Authorized requests utilize Application Passwords (standard CJS-secured base64 headers) instead of primary account passwords.
*   **Encrypted Storage**: Connection credentials are encrypted under `CREDENTIALS_VAULT_KEY` before PostgreSQL persistence.

---

## 2. Validation Gates

An article must successfully pass through five compliance gates before being submitted to remote WordPress:

1.  **Readability / Quality Score Gate**: Article metrics must meet or exceed 80% on standard indexing scores.
2.  **Originality & Readability Gate**: Plagiarism check and style metrics must show zero sentence-level duplicates against seed feeds.
3.  **Formatting Verification**: Body text is converted from Markdown to clean standard HTML blocks, stripping script tags or raw CSS.
4.  **Image Safety Verification**: Only verified media assets with public domain credentials or approved branding can be embedded.
5.  **Risk Audit Gate**: Risk metrics (e.g. sensitive financial or medical topics) must register score below 3, or the article is held for manual review.

---

## 3. Post States Handlers

Articles are published to remote WordPress under four defined post states:
*   `draft`: Post is saved as a staging draft for manual editor inspection.
*   `future`: Post is scheduled to be published at a specified future date.
*   `publish`: Post is published immediately and is live on the site.
*   `manual_review`: Held on the platform gateway and blocked from target API execution.
