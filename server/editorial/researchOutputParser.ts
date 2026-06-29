import { ResearchOutputSchema } from "./schemas";
import { ResearchOutput } from "./types";

export function parseAndValidateResearchOutput(jsonString: string): { success: boolean; data?: ResearchOutput; error?: any } {
  try {
    const rawData = JSON.parse(jsonString);
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
