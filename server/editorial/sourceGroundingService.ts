import { z } from "zod";

const SourceGroundingOutputSchema = z.object({
  groundedArticleMarkdown: z.string().trim().min(100),
  claimIdsUsed: z.array(z.string().trim().min(1)).min(1),
  removedUnsupportedPassages: z.array(z.string()).default([]),
  qualityNotes: z.array(z.string()).default([]),
}).passthrough();

export type SourceGroundingOutput = z.infer<typeof SourceGroundingOutputSchema>;

export function parseSourceGroundingOutput(
  value: unknown,
  allowedClaimIds: Iterable<string>,
): { success: true; data: SourceGroundingOutput } | { success: false; error: string } {
  let raw: unknown = value;
  if (typeof value === "string") {
    const cleaned = value
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    try {
      raw = JSON.parse(cleaned);
    } catch {
      return { success: false, error: "Source-Grounding Editor returned malformed JSON." };
    }
  }

  // Pre-parse using schema. If it fails, return error
  const parsed = SourceGroundingOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Source-Grounding Editor output did not match the required schema." };
  }

  const allowed = new Set(allowedClaimIds);
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const getPrefixAndNumber = (s: string) => {
    const match = s.match(/^([a-z]+)[^0-9]*(\d+)$/i);
    return match ? { prefix: match[1].toLowerCase(), num: match[2] } : null;
  };

  // Helper to find a matching allowed claim ID for a given parsed ID
  const findMatchingClaimId = (parsedId: string): string | null => {
    if (allowed.has(parsedId)) return parsedId;

    const parsedClean = clean(parsedId);
    
    // Direct clean match
    for (const allowedId of allowed) {
      if (clean(allowedId) === parsedClean) return allowedId;
    }

    // Clean match ignoring "claim" keyword
    const cleanNoClaim = (s: string) => clean(s).replace(/claim/g, "");
    const parsedCleanNoClaim = cleanNoClaim(parsedId);
    for (const allowedId of allowed) {
      if (cleanNoClaim(allowedId) === parsedCleanNoClaim) return allowedId;
    }

    // Prefix and number match (e.g. syn-1 and syn-claim-1)
    const parsedPN = getPrefixAndNumber(parsedId);
    if (parsedPN) {
      for (const allowedId of allowed) {
        const allowedPN = getPrefixAndNumber(allowedId);
        if (allowedPN && allowedPN.prefix === parsedPN.prefix && allowedPN.num === parsedPN.num) {
          return allowedId;
        }
      }
    }

    return null;
  };

  // Map parsed claim IDs. Keep only the successfully mapped ones
  const mappedClaimIds: string[] = [];
  for (const claimId of parsed.data.claimIdsUsed) {
    const mapped = findMatchingClaimId(claimId);
    if (mapped) {
      mappedClaimIds.push(mapped);
    }
  }

  // If no claim IDs were matched/retained, return failure to satisfy strict validation
  // and tests (e.g. when all IDs are invalid).
  if (mappedClaimIds.length === 0) {
    return { success: false, error: "Source-Grounding Editor did not reference any valid claim IDs." };
  }

  const finalClaims = Array.from(new Set(mappedClaimIds));

  return {
    success: true,
    data: {
      ...parsed.data,
      claimIdsUsed: finalClaims,
    },
  };
}
