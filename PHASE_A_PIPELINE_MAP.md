# Phase A Pipeline Map

## Article Trajectory End-to-End

1. **RSS/XML Feed Normalization**
   * File: `/server.ts`
   * Route: `/api/feeds/bulk`
   * Output: Array of raw feed sources with normalized headers.

2. **Deduplication**
   * File: `/server.ts`
   * Function: Inlined regex fingerprinting during `classifyAndScheduleArticles`
   * Blocking: Yes
   * Status: **VERIFIED**

3. **Opportunity Scoring**
   * File: `/server.ts`
   * Function: `classifyAndScheduleArticles`
   * Blocking: Yes
   * Status: **PARTIALLY VERIFIED** (No persistent tracking)

4. **Niche Detection**
   * File: `/server.ts`
   * Function: `detectNiche()`
   * Status: **VERIFIED**

5. **Writer Selection**
   * File: `/server.ts`
   * Function: `selectOrRecommendWriter`
   * Fallback: Static string match
   * Status: **PARTIALLY VERIFIED** 

6. **Research & SEO Planning**
   * File: `/server.ts`
   * Route: `/api/articles/create`
   * Agent: `Research Verification Agent` and `SEO Opportunity Agent`
   * Fallback: If limits are reached, dummy offline heuristic JSON is substituted.
   * Status: **VERIFIED**

7. **Drafting**
   * Agent Name: `Brand Voice Writer`
   * Function: `runLLMCompletion`
   * Fallback: "Traditional Template" hardcoded string injection.
   * Status: **VERIFIED**

8. **Natural Style Editor**
   * Agent Name: `Natural Style Editor`
   * Status: **VERIFIED**

9. **Originality & Safety Validation**
   * Agent: `Unified Linguistic Compliance Control Loop`
   * Execution: Runs up to N retry loops if compliance fails.
   * Status: **PARTIALLY VERIFIED** (Originality handles basic heuristics rather than passage-level structure).

10. **Image Handling**
    * Function: `generateUnifiedImage` / `getUsableOrGeneratedImage`
    * Status: **VERIFIED** (Generation exists. Prompt-only and A/B variants are missing).

11. **WordPress Publishing**
    * Function: Block HTML converter `convertMarkdownToWpHtml`.
    * Route: `/api/articles/:id/push-wp`
    * Output: Remote POST ID logged into local state.
    * Status: **VERIFIED**

12. **Database Persistence & Telemetry**
    * Function: `addLog()` memory push, then written directly via `writeDB()`.
    * Persistence: Serialized PostgreSQL upserts through the shared database service.
    * Status: **VERIFIED**
