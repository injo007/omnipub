# Phase A – Reality Audit

## 1. Executive Reality Summary
Historical finding: the pipeline began as a synchronous JSON-backed implementation. It now uses PostgreSQL for workspace state and transactional queue leases, although the main article-creation route still coordinates several stages in one request.

## 2. End-To-End Pipeline Execution
**Path Verified:** `/api/articles/create`
*   **RSS Normalization & Feed Discovery:** Verified. Happens synchronously when calling RSS bulk routes.
*   **Opportunity Scoring:** Partially Verified. It resides inside `classifyAndScheduleArticles`, but there are no real background crawlers (`cron` or `setInterval`); discovery relies entirely on UI interaction pings.
*   **Writer Selection:** Partially Verified. `selectOrRecommendWriter` uses LLM for assignment but lacks historical success telemetry or scoring.
*   **Agent 1 (Research):** Verified. Uses LLM to scrape facts.
*   **Agent 1.5 (SEO):** Verified. Defines Focus Keywords.
*   **Agent 2 (Drafting):** Verified. Writes initial drafts using the Focus Keyword.
*   **Agent 3 (Natural Editor):** Verified. Operates on the drafted text.
*   **Agent 4 (Originality) & Agent 5 (Compliance):** Partially Verified. Grouped inside a "Unified Linguistic Compliance Loop" that uses basic regex.
*   **Agent 6 (Visual Media):** Verified implementation via `generateUnifiedImage`. Employs multiple model fallbacks, but completely lacks A/B variants or prompt-only modes.
*   **WordPress Publisher:** Verified. Formats HTML block metadata and pushes via REST.

## 3. Storage & Configuration Reality
*   **Primary Database:** `db.json`.
*   **PostgreSQL Persistence:** Workspace records use JSONB upserts; publishing packages and jobs use transactions and row locks.
*   **Auth & Security:** Self-hosted bearer-token authentication is optional and controlled by `AUTH_REQUIRED` and `APP_API_TOKEN`.

## 4. UI-Only Features
*   Background Schedulers / Cron jobs. (Only manual triggering exists).
*   Multi-variant A/B Image Generation.
*   Prompt-only export execution without generating images.
*   Passage-level structural originality checks.
