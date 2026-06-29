# Phase A – Reality Audit

## 1. Executive Reality Summary
The codebase resembles a single-threaded functional pipeline rather than a resilient background-processing newsroom. While impressive linearly, the backend relies heavily on `db.json` as a synchronous persistence layer instead of true `Firestore` transactions. The majority of multi-agent tasks are bundled inside a single continuous Express route (`/api/articles/create`) that executes synchronously rather than across distributed message queues.

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
*   **Firestore Sync:** Exists (`persistToFirestore`) but is strictly unidirectional background sync without transactional safety (`runTransaction` is entirely absent).
*   **Auth & Security:** The `authMiddleware` reads Firebase tokens but provides global bypass logic for `development` environments and generic fallback UIDs.

## 4. UI-Only Features
*   Background Schedulers / Cron jobs. (Only manual triggering exists).
*   Multi-variant A/B Image Generation.
*   Prompt-only export execution without generating images.
*   Passage-level structural originality checks.
