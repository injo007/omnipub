import { ResearchOutputSchema } from "./schemas";
import { ResearchOutput } from "./types";

// ---------------------------------------------------------------------------
// Research Confidence Tier
// ---------------------------------------------------------------------------
// Instead of a binary pass/fail gate, we score the research output and
// assign it a tier. Downstream stages use the tier to apply proportionally
// stricter rules rather than halting the entire pipeline on partial output.
//
//  high     → ≥2 sources, all metadata complete, ≥3 ledger entries
//  partial  → 1 complete source, ≥1 ledger entry (single-source warning)
//  minimal  → some evidence present but below ideal thresholds (post-pub review)
//  failed   → no usable evidence; orchestrator should retry then abort
// ---------------------------------------------------------------------------

export type ResearchConfidenceTier = "high" | "partial" | "minimal" | "failed";

export interface ResearchConfidenceScore {
  tier: ResearchConfidenceTier;
  score: number;           // 0–10 composite
  reasons: string[];       // human-readable diagnostics
  warnings: string[];      // non-blocking notes passed to downstream stages
}

export function scoreResearchOutput(output: ResearchOutput): ResearchConfidenceScore {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // ── Source count ──────────────────────────────────────────────────────────
  const sourceCount = output.sources?.length ?? 0;
  if (sourceCount >= 2) {
    score += 3;
  } else if (sourceCount === 1) {
    score += 1;
    warnings.push("Single source: article will be flagged for independent review before auto-publish.");
  } else {
    reasons.push("No declared sources.");
  }

  // ── Source metadata completeness ──────────────────────────────────────────
  const sourcesWithFullMetadata = (output.sources ?? []).filter(
    (s) => s.url?.trim() && s.title?.trim() && s.publisher?.trim()
  );
  if (sourcesWithFullMetadata.length === sourceCount && sourceCount > 0) {
    score += 2;
  } else if (sourcesWithFullMetadata.length > 0) {
    score += 1;
    warnings.push(
      `${sourceCount - sourcesWithFullMetadata.length} source(s) have incomplete metadata (url/title/publisher).`
    );
  } else if (sourceCount > 0) {
    reasons.push("All declared sources are missing required metadata fields.");
  }

  // ── Evidence ledger depth ─────────────────────────────────────────────────
  const ledgerCount = output.evidenceLedger?.length ?? 0;
  if (ledgerCount >= 3) {
    score += 3;
  } else if (ledgerCount >= 1) {
    score += 1;
    warnings.push(`Thin evidence ledger (${ledgerCount} entr${ledgerCount === 1 ? "y" : "ies"}); factual gate will apply stricter thresholds.`);
  } else {
    reasons.push("Evidence ledger is empty.");
  }

  // ── Verified claim ratio ──────────────────────────────────────────────────
  const verifiedCount = (output.evidenceLedger ?? []).filter(
    (e) => e.verificationStatus === "verified"
  ).length;
  if (ledgerCount > 0 && verifiedCount / ledgerCount >= 0.5) {
    score += 2;
  } else if (verifiedCount > 0) {
    score += 1;
    warnings.push("Less than half of ledger claims are fully verified; grounding editor will apply conservative constraints.");
  } else if (ledgerCount > 0) {
    warnings.push("No verified claims in ledger; article will require human review before publishing.");
  }

  // ── Tier assignment ───────────────────────────────────────────────────────
  let tier: ResearchConfidenceTier;
  if (score >= 8) {
    tier = "high";
  } else if (score >= 5) {
    tier = "partial";
  } else if (score >= 2) {
    tier = "minimal";
  } else {
    tier = "failed";
  }

  return { tier, score, reasons, warnings };
}

const researchBriefTextKeys = [
  "claimText",
  "fact",
  "text",
  "claim",
  "summary",
  "description",
  "statement",
  "title",
  "content",
  "value",
  "label",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Providers sometimes return a structured fact object in a research-brief
 * list even though OmniPub stores the brief as plain strings. Extract only a
 * declared text field; never stringify an object, create a fallback fact, or
 * alter the evidence ledger.
 */
function extractResearchBriefText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!isRecord(value)) return undefined;

  for (const key of researchBriefTextKeys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

function normalizeResearchBriefLists(rawData: Record<string, unknown>): void {
  if (!isRecord(rawData.researchBrief)) return;

  const researchBrief = rawData.researchBrief;

  const listFields = [
    "verifiedFacts",
    "unverifiedClaims",
    "conflictingClaims",
    "freshnessWarnings",
    "recommendedAngles",
    "readerQuestions",
    "riskFlags",
  ];

  for (const field of listFields) {
    const currentValue = researchBrief[field];
    if (!Array.isArray(currentValue)) continue;

    const normalizedItems = currentValue.map(extractResearchBriefText);
    // Leave unrecognized objects intact so the schema rejects malformed
    // provider output rather than silently discarding potentially important
    // context. Known structured brief entries become their declared text.
    if (normalizedItems.every((item) => typeof item === "string")) {
      researchBrief[field] = normalizedItems;
    }
  }
}

export function parseAndValidateResearchOutput(rawOutput: unknown): { success: boolean; data?: ResearchOutput; error?: unknown } {
  try {
    let cleanString: string;
    if (typeof rawOutput === "string") {
      cleanString = rawOutput;
    } else if (rawOutput && typeof rawOutput === "object") {
      cleanString = JSON.stringify(rawOutput);
    } else {
      return { success: false, error: "Research provider returned empty output." };
    }

    if (typeof cleanString === "string") {
      cleanString = cleanString.replace(/<think>[\s\S]*?<\/think>/gi, "");
      if (cleanString.includes("<think>")) {
        const jsonStart = cleanString.indexOf("{");
        const thinkStart = cleanString.indexOf("<think>");
        if (jsonStart !== -1 && jsonStart > thinkStart) {
          cleanString = cleanString.substring(jsonStart);
        } else {
          cleanString = cleanString.replace(/<think>[\s\S]*/gi, "");
        }
      }
      cleanString = cleanString.trim();

      if (!cleanString) {
        return { success: false, error: "Research provider returned empty output." };
      }
      if (cleanString.startsWith("```")) {
        cleanString = cleanString.replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/g, "$1");
      }
      cleanString = cleanString.trim();

      // Extract enclosed JSON block using stack-based brace matching
      const startBrace = cleanString.indexOf('{');
      if (startBrace !== -1) {
        let braceStack = 0;
        let inStringInside = false;
        let escapeInside = false;
        let endIdx = -1;

        for (let i = startBrace; i < cleanString.length; i++) {
          const char = cleanString[i];
          if (escapeInside) {
            escapeInside = false;
            continue;
          }
          if (char === '\\') {
            escapeInside = true;
            continue;
          }
          if (char === '"') {
            inStringInside = !inStringInside;
            continue;
          }
          if (!inStringInside) {
            if (char === '{') {
              braceStack++;
            } else if (char === '}') {
              braceStack--;
              if (braceStack === 0) {
                endIdx = i;
                break;
              }
            }
          }
        }

        if (endIdx !== -1) {
          cleanString = cleanString.slice(startBrace, endIdx + 1);
        } else {
          cleanString = cleanString.slice(startBrace);
        }
      }
    }

    const rawData: unknown = JSON.parse(cleanString);

    if (!isRecord(rawData)) {
      return { success: false, error: "Parsed JSON is not an object" };
    }

    normalizeResearchBriefLists(rawData);

    // Research output is the factual boundary for later stages. Do not invent
    // placeholder sources, claims, dates, or verification status merely to
    // satisfy a schema. Invalid output is repaired once by the orchestrator
    // and then held for review.

    const result = ResearchOutputSchema.safeParse(rawData);

    if (result.success) {
      if (!result.data.evidenceLedger || result.data.evidenceLedger.length === 0) {
        return { success: false, error: "Evidence ledger must not be empty" };
      }
      for (const entry of result.data.evidenceLedger) {
        if (entry.verificationStatus === "verified" && (!entry.sourceUrl || entry.sourceUrl.trim() === "")) {
          return { success: false, error: "Verified claims MUST have a valid sourceUrl attached." };
        }
      }
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (e) {
    return { success: false, error: "Invalid JSON format" };
  }
}
