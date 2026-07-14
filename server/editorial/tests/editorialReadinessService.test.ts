import { describe, expect, it } from "vitest";
import { getArticleFormatProfile } from "../articleFormatService";
import { assessEditorialReadiness } from "../editorialReadinessService";
import { BUILT_IN_NICHE_POLICIES } from "../nichePolicyService";

const ledger = [{
  claimId: "claim-1", articleId: "article-1", articleTraceId: "trace-1", claimText: "A verified fact.",
  sourceUrl: "https://example.com/source", sourceTitle: "Primary source", publisher: "Example",
  sourceDate: "2026-07-14", accessedAt: "2026-07-14", sourceType: "official", isPrimarySource: true,
  confidence: 0.95, freshnessStatus: "current" as const, verificationStatus: "verified" as const,
  supportsClaim: true, contradictsClaim: false, riskLevel: "low", addedByAgent: "Research", notes: "Verified",
}];

const analysis = `The announcement changes how readers should understand the product and its limits. It puts a verified development in context without claiming more than the evidence can support. The account focuses on what is documented, who supplied it, and which practical consequences can reasonably be drawn today.

## What changed

The primary announcement confirms the development and explains the immediate practical impact. The evidence matters because it distinguishes a released detail from an early expectation. Readers should notice the boundary between a published specification and a feature that remains conditional, because that boundary affects any decision made from this report. The confirmed record gives a stable starting point, but it does not turn every implication into a fact.

## Why the evidence matters

Readers can use the confirmed information to understand the likely consequences, while the unresolved details remain clearly bounded. That makes the account useful without turning uncertainty into a prediction. A careful explanation also prevents a small product change from becoming a vague claim about the entire market. The most useful reporting states the evidence, explains the consequence, and leaves space for later disclosures to change the picture.

## What remains unresolved

The available record does not settle every follow-up question, so those questions should remain open until further evidence arrives. Availability, compatibility, and the response from affected users may depend on subsequent documentation. Until those details are published, readers can separate what has been verified from what still needs independent confirmation. That is more valuable than a confident forecast based on incomplete material.

## What readers can do next

Readers can compare the confirmed information with their own needs, watch for official follow-up material, and avoid treating an announcement as a universal recommendation. This approach keeps the story practical without inventing a result. It also makes clear why the evidence is useful: it helps a reader decide what to monitor, not what they are required to believe. A responsible account offers this context in plain language, avoids false certainty, and gives later reporting room to refine the conclusion.`;

const publicationReadyAnalysis = `${analysis}

## How to read the next update

The next official update should be assessed against the same standard: identify the source, distinguish confirmation from interpretation, and explain the change in terms a reader can use. This leaves the article grounded in evidence rather than promotional language. It also gives readers a clear reason to return when the unanswered questions have reliable answers, instead of pretending that an incomplete announcement already resolves them. Careful reporting can be engaging without turning every development into a certainty, a recommendation, or a promise.`;

describe("assessEditorialReadiness", () => {
  it("passes a sufficiently sourced article that follows its selected format", () => {
    const result = assessEditorialReadiness({
      content: publicationReadyAnalysis,
      evidenceLedger: ledger,
      playbook: BUILT_IN_NICHE_POLICIES.find((policy) => policy.policyId === "technology")!.playbook,
      articleFormat: getArticleFormatProfile("evidence_led_analysis")!,
    });
    expect(result.playbookPassed).toBe(true);
    expect(result.compliancePassed).toBe(true);
  });

  it("blocks a prohibited investment recommendation even when the article has evidence", () => {
    const result = assessEditorialReadiness({
      content: `${analysis}\n\nReaders should buy this stock before the price changes.`,
      evidenceLedger: ledger,
      playbook: BUILT_IN_NICHE_POLICIES.find((policy) => policy.policyId === "business_finance")!.playbook,
      articleFormat: getArticleFormatProfile("evidence_led_analysis")!,
    });
    expect(result.compliancePassed).toBe(false);
    expect(result.blockingFailures.join(" ")).toMatch(/prohibits/i);
  });

  it("blocks a generic conclusion in a format that forbids one", () => {
    const result = assessEditorialReadiness({
      content: `${analysis}\n\n## Conclusion\n\nThe development is important and readers should wait for verified information.`,
      evidenceLedger: ledger,
      playbook: BUILT_IN_NICHE_POLICIES.find((policy) => policy.policyId === "technology")!.playbook,
      articleFormat: getArticleFormatProfile("evidence_led_analysis")!,
    });
    expect(result.playbookPassed).toBe(false);
    expect(result.blockingFailures.join(" ")).toMatch(/generic conclusion/i);
  });
});
