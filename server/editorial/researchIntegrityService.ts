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

/**
 * A feed URL often carries tracking parameters while an LLM returns the
 * canonical article URL.  Those are still the same declared source.  Compare
 * the publication host and path only; query strings are deliberately excluded
 * from provenance matching, never from the stored source URL.
 */
function canonicalPublicationLocation(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${host}${path}`;
  } catch {
    return null;
  }
}

function isSameDeclaredArticle(first: string, second: string): boolean {
  const firstLocation = canonicalPublicationLocation(first);
  const secondLocation = canonicalPublicationLocation(second);
  return Boolean(firstLocation && secondLocation && firstLocation === secondLocation);
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

/**
 * Reconciles a model's canonical rendition of the supplied seed URL with the
 * exact source URL stored by the workflow. The supplied source is always a
 * declared record because the research prompt limits the model to that source.
 * This fixes benign RSS tracking differences without accepting a different
 * publisher or article as evidence.
 */
export function reconcileDeclaredSourceReferences<T extends ResearchEvidenceRecord>(
  sources: ResearchSourceRecord[] | undefined,
  evidence: T[] | undefined,
  declaredSource?: ResearchSourceRecord,
): { sources: ResearchSourceRecord[]; evidence: T[] } {
  const inputSources = Array.isArray(sources) ? sources : [];
  const inputEvidence = Array.isArray(evidence) ? evidence : [];
  if (!declaredSource?.url || !isPublicationUrl(declaredSource.url)) {
    return { sources: inputSources, evidence: inputEvidence };
  }

  const matchingSource = inputSources.find((source) =>
    Boolean(source?.url && isSameDeclaredArticle(source.url, declaredSource.url!)),
  );
  const canonicalSource: ResearchSourceRecord = {
    url: declaredSource.url,
    title: declaredSource.title?.trim() || matchingSource?.title?.trim() || "Declared source",
    publisher: declaredSource.publisher?.trim() || matchingSource?.publisher?.trim() || "Declared publisher",
  };

  // The source context was supplied by the workflow, so retain it even when
  // the model omitted the redundant top-level source row. This does not make
  // any unrelated publisher or article an accepted evidence source.
  const reconciledSources = inputSources.map((source) =>
    source?.url && isSameDeclaredArticle(source.url, declaredSource.url!)
      ? canonicalSource
      : source,
  );
  if (!matchingSource) reconciledSources.push(canonicalSource);

  const reconciledEvidence = inputEvidence.map((entry) =>
    // Parser fallbacks can leave a blank or placeholder source URL. Those
    // entries still describe the supplied source context; anchor them to the
    // declared source rather than rejecting a valid rewrite. Concrete URLs
    // for a different article or publisher remain untouched and fail below.
    (!isPublicationUrl(entry?.sourceUrl || "") ||
      (entry?.sourceUrl && isSameDeclaredArticle(entry.sourceUrl, declaredSource.url!)))
      ? { ...entry, sourceUrl: declaredSource.url }
      : entry,
  ) as T[];

  return { sources: reconciledSources, evidence: reconciledEvidence };
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
  if (validSources.length < minimumSources) {
    reasons.push(`At least ${minimumSources} complete HTTPS source records are required; received ${validSources.length}.`);
  }

  const supportedEvidence = (evidence || []).filter((entry) =>
    (entry?.verificationStatus === "verified" || entry?.verificationStatus === "partially_verified") &&
    entry?.supportsClaim === true &&
    Boolean(entry.sourceUrl) &&
    validSources.some((source) =>
      normalizedUrl(source.url!) === normalizedUrl(entry.sourceUrl!) ||
      isSameDeclaredArticle(source.url!, entry.sourceUrl!),
    ),
  );
  if (supportedEvidence.length === 0) {
    reasons.push("No verified or partially verified evidence-ledger claim is linked to a declared source record.");
  }

  return { passed: reasons.length === 0, validSourceCount: validSources.length, reasons };
}
