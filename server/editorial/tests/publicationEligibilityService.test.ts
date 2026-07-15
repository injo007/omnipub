import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { assessPublicationEligibility } from "../publicationEligibilityService";

const content = "Approved source-grounded revision.";
const approvedArticle = {
  status: "draft",
  content,
  approvedRevision: {
    versionId: "approved_1",
    contentHash: crypto.createHash("sha256").update(content).digest("hex"),
  },
  pipelineRecords: {
    pipelineStates: "APPROVED_FOR_PUBLISHING",
    evidenceLedger: [{ claimId: "c1", sourceUrl: "https://news.example.org/report" }],
    validationResults: {
      adSensePassed: true,
      safetyPassed: true,
      claimValidation: { passed: true },
      fabricatedCheck: { passed: true },
      timeSensitiveCheck: { passed: true },
    },
  },
};

describe("publication eligibility", () => {
  it("allows only the exact approved revision", () => {
    expect(assessPublicationEligibility(approvedArticle)).toEqual({ passed: true, reasons: [] });
    expect(assessPublicationEligibility({ ...approvedArticle, content: "Changed after approval." }).passed).toBe(false);
  });

  it("blocks manual-review and legacy records without an approval record", () => {
    expect(assessPublicationEligibility({ ...approvedArticle, status: "manual_review" }).passed).toBe(false);
    expect(assessPublicationEligibility({ id: "legacy", status: "draft", content }).passed).toBe(false);
  });
});
