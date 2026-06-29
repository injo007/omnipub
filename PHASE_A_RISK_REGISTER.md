# Phase A - Risk Register

## 1. Security & Authentication Bypass
**Risk Level:** HIGH
**Description:** Development environments and specific endpoints explicitly bypass authentication. While there's an `authMiddleware` enforcing Firebase verification, tokens can be bypassed via `DEV_BYPASS_TOKEN` or `process.env.FIREBASE_AUTH_STRICT` toggles.
**Impact:** Unauthorized users could potentially trigger expensive workflows if misconfigured in production.

## 2. In-Memory and JSON Database Limitations
**Risk Level:** HIGH
**Description:** `db.json` is the sole source of truth for the local application pipeline. Concurrent updates (from parallel requests or future multi-tenant operations) will likely experience race conditions. Missing `runTransaction` blocks makes it unsafe.
**Impact:** Potential database corruption under high parallel load.

## 3. Synchronous Long-Running Pipeline Requests
**Risk Level:** MEDIUM
**Description:** `/api/articles/create` locks the Express request for up to 30-100 seconds while multiple LLMs generate content. 
**Impact:** Vercel/Cloud functions or typical proxies will hard-timeout before the article completes processing. Requires web sockets, `bullmq`, or streaming interfaces for resilient behavior.

## 4. Lack of True Originality Checks
**Risk Level:** MEDIUM
**Description:** The system relies on superficial string parsing instead of semantic originality validators.
**Impact:** May allow structural copying of input articles to bypass standard plagiarism detection, causing brand risk.

## 5. Non-existant Background Automations
**Risk Level:** LOW
**Description:** Cron intervals and periodic feed ingestions are strictly simulated by the React UI triggering periodic endpoints.
**Impact:** If the user closes their browser, background crawls and agent task generation completely stops.
