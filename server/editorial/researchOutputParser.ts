import { ResearchOutputSchema } from "./schemas";
import { ResearchOutput } from "./types";

export function parseAndValidateResearchOutput(rawOutput: unknown): { success: boolean; data?: ResearchOutput; error?: any } {
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

    const rawData = JSON.parse(cleanString);

    if (!rawData || typeof rawData !== "object") {
      return { success: false, error: "Parsed JSON is not an object" };
    }

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
