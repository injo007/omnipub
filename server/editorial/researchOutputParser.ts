import { ResearchOutputSchema } from "./schemas";
import { ResearchOutput } from "./types";

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
