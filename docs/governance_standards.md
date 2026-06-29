# Enterprise Autonomous Editorial Intelligence Platform
## Governance, Feature Flags, and Cost Safety Standards

This document specifies operational standards, feature flag schemas, emergency kill switch mechanisms, rate limit configurations, and cost safety boundaries.

---

## 1. Governance Feature Flags

Feature flags are server-controlled options allowing operators to toggle operational modules dynamically without redeploying code:

*   `enableRssIngestion`: Controls RSS XML catalog crawlers and parser engines.
*   `enableAiRewriting`: Toggles creative drafting, editing, and SEO planning agents.
*   `enableImageGeneration`: Controls DALLE-3 / Imagen generative media pipelines.
*   `enablePhaseCRepair`: Enables automated correction loops for malformed content briefs.
*   `enablePhaseDPackaging`: Toggles the final assembly of immutable publishing packages.
*   `enablePublishingJobCreation`: Enables adding jobs to the database queue.
*   `enableWorkerExecution`: Toggles active worker thread leases.
*   `enableWordPressUpdates`: Allows remote site REST requests to post or edit content.
*   `enableAutomaticReconciliation`: Toggles background post-state checking.
*   `enableModelFallback`: Allows alternative API redirection upon provider failure.

---

## 2. Emergency Kill Switches

Kill switches provide rapid mitigation controls when security, stability, or cost boundaries are breached:

*   `disableAllPublishing`: Instantly blocks all active job leases and remote HTTP posts across the entire workspace.
*   `disabledWordPressSites`: Holds job executions for specified target site IDs.
*   `disabledProviders`: Blocks specific API models/providers if credentials or routing paths fail.
*   `revokedCredentials`: Restricts access tokens or application keys dynamically.
*   `problematicArticles` / `problematicPackages`: Blocks specific assets from entering active publishing pipelines.

---

## 3. Rate Limits & Governance Controls

The system enforces strict request body-size limits and call frequencies to prevent resource exhaustion:

*   **Articles per Hour Limit**: Maximum 50 items.
*   **Publishing Jobs per Site per Minute**: Maximum 2 items.
*   **Worker Concurrency**: 1 to 20 concurrent leases.
*   **Job Retry Ceiling**: Maximum 5 retry attempts before being redirected to the Dead-Letter Queue (DLQ).
*   **Reconciliation Limit**: Maximum 3 attempts before status triggers manual review.
*   **JSON Payload Limit**: Strictly restricted to 1MB ceiling on all public routes.

---

## 4. Cost Controls & Cost Protection

To manage operational spend safely, strict financial guardrails are enforced across all execution stages:

*   **Cost per Article Limit**: Maximum $0.15 USD. Includes all token generations and associated illustrative variant matching.
*   **Monthly Budget Ceiling**: Cap of $15.00 USD. Checked dynamically prior to any generation loop.
*   **Warning Threshold**: Engagement alerts trigger when cumulative spend reaches 80% ($12.00 USD) of monthly budget limits.
*   **Hard Stop Enforcement**: Subsequent API runs are blocked automatically when cumulative spend reaches the $15.00 budget ceiling.
*   **No Silent Fallback to Expensive Models**: If fallback is triggered, it is strictly forbidden from selecting models with higher price metrics. It must route to comparable or cheaper models (e.g., Llama 3) to protect workspace budgets.
*   **Security Overrides**: Operators may bypass limits using audited, non-reputable cryptographic override authorization records logged in the security stream.
