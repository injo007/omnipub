import crypto from "crypto";

export interface PublicationEligibility {
  passed: boolean;
  reasons: string[];
}

function contentHash(content: unknown): string {
  return crypto.createHash("sha256").update(typeof content === "string" ? content : "").digest("hex");
}

/**
 * Publication is permitted only for the exact article revision that completed
 * the evidence and editorial gates. Legacy drafts without that record remain
 * readable but require re-validation before queueing or direct WordPress push.
 */
export function assessPublicationEligibility(article: unknown): PublicationEligibility {
  const candidate = article as any;
  const reasons: string[] = [];
  const terminalState = candidate?.pipelineRecords?.pipelineStates;
  const validation = candidate?.pipelineRecords?.validationResults;
  const evidenceLedger = candidate?.pipelineRecords?.evidenceLedger;
  const approvedRevision = candidate?.approvedRevision;

  if (candidate?.status === "manual_review") {
    reasons.push("Article is marked for manual review.");
  }
  if (terminalState !== "APPROVED_FOR_PUBLISHING") {
    reasons.push("Article did not reach APPROVED_FOR_PUBLISHING.");
  }
  if (!validation?.adSensePassed || !validation?.safetyPassed || !validation?.claimValidation?.passed) {
    reasons.push("Required editorial and factual validation results are missing or failed.");
  }
  if (!validation?.fabricatedCheck?.passed || !validation?.timeSensitiveCheck?.passed) {
    reasons.push("Fabrication or time-sensitive fact validation did not pass.");
  }
  if (!Array.isArray(evidenceLedger) || evidenceLedger.length === 0) {
    reasons.push("No evidence ledger is attached to the article.");
  }
  if (!approvedRevision?.versionId || !approvedRevision?.contentHash) {
    reasons.push("No approved article revision is recorded.");
  } else if (approvedRevision.contentHash !== contentHash(candidate?.content)) {
    reasons.push("Current article content differs from the approved revision.");
  }

  return { passed: reasons.length === 0, reasons };
}
