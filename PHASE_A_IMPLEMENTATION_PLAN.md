# Phase A - Implementation Plan (Leading into Phase B/C)

Based on our empirical gap analysis, these updates must be implemented to fulfill the specification:

## 1. Phase B: Solidify the Editorial Foundation
*   **Establish Evidence Ledger**: Introduce a deterministic schema representing source-to-claim mappings stored on the `Article` object inside `db.json` and Firestore.
*   **Establish Editorial Brief Schema**: Build an intermediate pipeline state that produces and saves an `EditorialBrief` rather than immediately executing the drafting models.

## 2. Phase C: Upgrade the Writer System
*   **Writer Telemetry**: Modify `selectOrRecommendWriter` to record its explicit decisions (confidence scores, chosen ID) into the workflow metadata.
*   **Niche Metrics**: Upgrade the Writer interface to maintain `averageQualityScore`, `successRate`, and `averageNaturalnessScore`.

## 3. Phase F: Overhaul Compliance & Originality
*   **Fabricated Experience Validator**: Embed exact rules catching "I travelled", "I visited", and reject publication.
*   **Passage-Level Originality**: Upgrade the Linguistic Compliance Loop to execute comparative string distance algorithms on individual paragraph arrays rather than the entire text file.

## 4. Phase H: Media Expansion
*   **Visual Generation Modes**: Refactor `generateUnifiedImage` into discrete functions handling `GENERATE_PROMPT_ONLY`, `GENERATE_AB_VARIANTS`. Expose these switches to the `saasConfig` and `modelSettings` DB objects.

## 5. Phase J: Human Editor Screen
*   Enhance existing detail views to display the resulting `Evidence Ledger`, `A/B Media Prompts`, and specific `Passage-Level Violations`.
