import type { ArticleFormatProfile } from "./articleFormatService";
import { extractEditorialTextBlocks } from "./editorialTextService";
import type { EvidenceLedger, NichePlaybook } from "./types";

export interface EditorialReadinessResult {
  playbookPassed: boolean;
  compliancePassed: boolean;
  blockingFailures: string[];
  warnings: string[];
}

const HIGH_RISK_PATTERNS = [
  /\bguaranteed (?:result|outcome|return|cure|profit|safety)\b/i,
  /\b(?:buy|sell) (?:this|the) (?:stock|share|investment)\b/i,
  /\b(?:cure|diagnose|treat) (?:your|this) (?:condition|disease|illness)\b/i,
  /\b(?:you should|everyone should) (?:buy|sell|take|avoid)\b/i,
];

function sourceCoverageIsSufficient(ledger: EvidenceLedger): boolean {
  const verified = ledger.filter((entry) => entry.supportsClaim && entry.verificationStatus === "verified" && Boolean(entry.sourceUrl));
  const uniqueSources = new Set(verified.map((entry) => entry.sourceUrl));
  return verified.some((entry) => entry.isPrimarySource) || uniqueSources.size >= 2;
}

function hasProhibitedClaim(content: string, playbook: NichePlaybook): string | undefined {
  const normalized = content.toLowerCase();
  const directMatch = playbook.prohibitedClaims.find((claim) => normalized.includes(claim.toLowerCase()));
  if (directMatch) return directMatch;
  const highRiskMatch = HIGH_RISK_PATTERNS.find((pattern) => pattern.test(content));
  return highRiskMatch?.source;
}

function validateFormat(content: string, format: ArticleFormatProfile): string[] {
  const blocks = extractEditorialTextBlocks(content);
  const normalized = blocks.text.toLowerCase();
  const failures: string[] = [];

  if (blocks.text.split(/\s+/).filter(Boolean).length < 350) {
    failures.push("Article is too short for a publication-ready longform format.");
  }
  if (blocks.paragraphs.length < 3) {
    failures.push("Article does not contain enough developed paragraphs.");
  }

  switch (format.id) {
    case "evidence_led_analysis":
      if (blocks.headings.length < 2) failures.push("Evidence-led analysis requires at least two developed sections.");
      break;
    case "reader_explainer":
      if (blocks.headings.length < 2) failures.push("Reader explainer requires clear explanatory sections.");
      if (!/(\bwhat\b|\bhow\b|\bwhy\b|\bwhen\b|\bwhere\b|\bwho\b)/i.test(blocks.paragraphs[0] || "")) {
        failures.push("Reader explainer opening does not answer or frame a reader question.");
      }
      break;
    case "chronology_brief":
      if (blocks.headings.length < 2) failures.push("Chronology brief requires a chronological section and a context section.");
      if (!/\b(?:19|20)\d{2}\b/.test(blocks.text)) failures.push("Chronology brief has no verifiable date marker.");
      break;
    case "comparison_brief":
      if (!/\b(?:compared|comparison|versus|vs\.?|than|difference)\b/i.test(normalized)) {
        failures.push("Comparison brief does not state a supported contrast.");
      }
      if (blocks.headings.length < 2) failures.push("Comparison brief requires separate comparison sections.");
      break;
    case "decision_guide":
      if (!/\b(?:if you|choose|decision|consider|depending on|trade-?off)\b/i.test(normalized)) {
        failures.push("Decision guide does not present an explicit reader decision or trade-off.");
      }
      if (blocks.headings.length < 2 && blocks.listItemCount < 2) failures.push("Decision guide requires scannable criteria or sections.");
      break;
  }

  const prohibitedHeading = blocks.headings.find((heading) => /^(?:in )?conclusion$|^final thoughts$/i.test(heading.trim()));
  if (prohibitedHeading && format.forbiddenPatterns.some((pattern) => pattern.includes("conclusion"))) {
    failures.push("Format forbids a generic conclusion section.");
  }
  if (/\bfaq\b/i.test(normalized) && format.forbiddenPatterns.some((pattern) => pattern.includes("FAQ"))) {
    failures.push("Format forbids a decorative FAQ section.");
  }

  return failures;
}

/**
 * A deterministic release gate. It verifies only observable facts rather than
 * pretending to infer semantic quality from a model score. Human/editorial
 * review remains necessary for subjective judgments.
 */
export function assessEditorialReadiness(input: {
  content: string;
  evidenceLedger: EvidenceLedger;
  playbook: NichePlaybook;
  articleFormat: ArticleFormatProfile;
}): EditorialReadinessResult {
  const blockingFailures = validateFormat(input.content, input.articleFormat);
  const warnings: string[] = [];

  if (!sourceCoverageIsSufficient(input.evidenceLedger)) {
    blockingFailures.push("Evidence ledger lacks a primary source or two independently verified sources.");
  }

  const prohibitedClaim = hasProhibitedClaim(input.content, input.playbook);
  if (prohibitedClaim) {
    blockingFailures.push(`Niche policy prohibits this claim or recommendation pattern: ${prohibitedClaim}`);
  }

  const unverifiedClaims = input.evidenceLedger.filter((entry) => entry.supportsClaim && entry.verificationStatus !== "verified");
  if (unverifiedClaims.length > 0) {
    warnings.push(`${unverifiedClaims.length} supported ledger claim(s) are not fully verified and must not be presented as settled fact.`);
  }

  return {
    playbookPassed: blockingFailures.length === 0,
    compliancePassed: !prohibitedClaim,
    blockingFailures,
    warnings,
  };
}
