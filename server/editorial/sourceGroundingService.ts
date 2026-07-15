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

  const parsed = SourceGroundingOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Source-Grounding Editor output did not match the required schema." };
  }

  const allowed = new Set(allowedClaimIds);
  const unknownClaimIds = parsed.data.claimIdsUsed.filter((claimId) => !allowed.has(claimId));
  if (unknownClaimIds.length > 0) {
    return { success: false, error: `Source-Grounding Editor referenced unknown claim IDs: ${unknownClaimIds.join(", ")}.` };
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      claimIdsUsed: Array.from(new Set(parsed.data.claimIdsUsed)),
    },
  };
}
