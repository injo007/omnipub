export interface ResearchSourceRecord {
  url?: string;
  title?: string;
  publisher?: string;
}

export interface ResearchEvidenceRecord {
  sourceUrl?: string;
  verificationStatus?: string;
  supportsClaim?: boolean;
}

export interface ResearchIntegrityAssessment {
  passed: boolean;
  validSourceCount: number;
  reasons: string[];
}

function normalizedUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function isPublicationUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname !== "example.com" &&
      !url.hostname.endsWith(".example.com") &&
      !url.hostname.endsWith(".test") &&
      !url.hostname.endsWith(".invalid");
  } catch {
    return false;
  }
}

/** Ensures the evidence ledger is internally traceable before drafting begins. */
export function assessResearchIntegrity(
  sources: ResearchSourceRecord[] | undefined,
  evidence: ResearchEvidenceRecord[] | undefined,
  minimumSources: number,
): ResearchIntegrityAssessment {
  const reasons: string[] = [];
  const validSources = (sources || []).filter((source) =>
    Boolean(source?.title?.trim()) &&
    Boolean(source?.publisher?.trim()) &&
    isPublicationUrl(source?.url || ""),
  );
  const sourceUrls = new Set(validSources.map((source) => normalizedUrl(source.url!)));

  if (validSources.length < minimumSources) {
    reasons.push(`At least ${minimumSources} complete HTTPS source records are required; received ${validSources.length}.`);
  }

  const verifiedEvidence = (evidence || []).filter((entry) =>
    entry?.verificationStatus === "verified" &&
    entry?.supportsClaim === true &&
    Boolean(entry.sourceUrl) &&
    sourceUrls.has(normalizedUrl(entry.sourceUrl!)),
  );
  if (verifiedEvidence.length === 0) {
    reasons.push("No verified evidence-ledger claim is linked to a declared source record.");
  }

  return { passed: reasons.length === 0, validSourceCount: validSources.length, reasons };
}
