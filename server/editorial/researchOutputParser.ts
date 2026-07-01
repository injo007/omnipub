import { ResearchOutputSchema } from "./schemas";
import { ResearchOutput } from "./types";

export function parseAndValidateResearchOutput(jsonString: string): { success: boolean; data?: ResearchOutput; error?: any } {
  try {
    let cleanString = jsonString;
    if (typeof cleanString === "string") {
      cleanString = cleanString.replace(/<think>[\s\S]*?<\/think>/gi, "");
      cleanString = cleanString.replace(/<think>[\s\S]*/gi, "");
      cleanString = cleanString.trim();
      if (cleanString.startsWith("```")) {
        cleanString = cleanString.replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/g, "$1");
      }
      cleanString = cleanString.trim();
    }
    const rawData = JSON.parse(cleanString);
    
    // Auto-populate evidenceLedger entries if they are missing required identifiers
    if (rawData && Array.isArray(rawData.evidenceLedger)) {
      const traceId = rawData.articleTraceId || "UNKNOWN";
      for (const entry of rawData.evidenceLedger) {
        if (entry && typeof entry === "object") {
          if (!entry.articleTraceId || entry.articleTraceId === "undefined" || entry.articleTraceId === "") {
            entry.articleTraceId = traceId;
          }
          if (!entry.articleId || entry.articleId === "undefined" || entry.articleId === "") {
            entry.articleId = traceId;
          }
        }
      }
    }

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
