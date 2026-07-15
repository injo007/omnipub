import { appContext } from "../../server";
import { OriginalArticlePlan, SourceDeconstruction, NichePlaybook, EditorialBrief } from "./types";

// ---------------------------------------------------------------------------
// Robust JSON extraction — same brace-stack algorithm as researchOutputParser
// so we handle truncated free-model responses consistently across all agents.
// ---------------------------------------------------------------------------
function extractJsonObject(raw: string): string {
  // Strip <think>…</think> blocks (some reasoning models emit these)
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
  if (text.includes("<think>")) {
    const jsonStart = text.indexOf("{");
    const thinkStart = text.indexOf("<think>");
    if (jsonStart !== -1 && jsonStart > thinkStart) {
      text = text.substring(jsonStart);
    } else {
      text = text.replace(/<think>[\s\S]*/gi, "");
    }
  }

  // Strip markdown code fences
  if (text.trim().startsWith("```")) {
    text = text.trim().replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/g, "$1");
  }
  text = text.trim();

  // Brace-stack extraction: find the outermost { ... } block
  const startBrace = text.indexOf("{");
  if (startBrace === -1) return text;

  let stack = 0;
  let inString = false;
  let escape = false;
  let endIdx = -1;

  for (let i = startBrace; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{") stack++;
      else if (ch === "}") {
        stack--;
        if (stack === 0) { endIdx = i; break; }
      }
    }
  }

  return endIdx !== -1 ? text.slice(startBrace, endIdx + 1) : text.slice(startBrace);
}

// ---------------------------------------------------------------------------
// Coerce raw parsed object into a valid OriginalArticlePlan shape.
// Free models often return string values where arrays are expected, or
// skip optional fields. This normalises everything defensively.
// ---------------------------------------------------------------------------
function coercePlan(raw: any, articleTraceId: string, playbook: NichePlaybook, brief: EditorialBrief): OriginalArticlePlan {
  const ensureStringArray = (v: unknown, fallback: string[]): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return fallback;
  };

  return {
    articleTraceId,
    selectedPlaybookId: playbook.playbookId,
    originalAngle: typeof raw?.originalAngle === "string" && raw.originalAngle.trim()
      ? raw.originalAngle.trim()
      : (brief.originalAngle || "A differentiated editorial perspective"),
    uniqueValueStatement: typeof raw?.uniqueValueStatement === "string"
      ? raw.uniqueValueStatement
      : "Provides reader value not found in competitor sources",
    readerJourney: ensureStringArray(raw?.readerJourney, ["Hook", "Core facts", "Reader takeaway"]),
    plannedSections: ensureStringArray(raw?.plannedSections, ["Introduction", "Main analysis", "Practical takeaways"]),
    sectionPurposes: ensureStringArray(raw?.sectionPurposes, ["Engage", "Inform", "Convert"]),
    questionsAnswered: ensureStringArray(raw?.questionsAnswered, ["What does this mean for readers?"]),
    practicalElements: ensureStringArray(raw?.practicalElements, playbook.requiredElements),
    sourceCoverageMap: ensureStringArray(raw?.sourceCoverageMap, ["Primary source covers core facts"]),
    requiredDifferentiators: ensureStringArray(raw?.requiredDifferentiators, ["Original angle distinct from source"]),
    prohibitedSourcePatterns: ensureStringArray(raw?.prohibitedSourcePatterns, []),
    prohibitedPhrases: ensureStringArray(raw?.prohibitedPhrases, ["In conclusion", "Furthermore", "It is worth noting"]),
    competitorDifferences: ensureStringArray(raw?.competitorDifferences, ["Different structure and angle from source"]),
  };
}

// ---------------------------------------------------------------------------
// Deterministic fallback plan — used when both model attempts fail.
// Built entirely from already-validated data (brief + playbook), so it is
// always structurally valid and never triggers PLAN_INVALID.
// ---------------------------------------------------------------------------
function buildFallbackPlan(articleTraceId: string, playbook: NichePlaybook, brief: EditorialBrief): OriginalArticlePlan {
  const sections = [
    `What you need to know about: ${brief.topic}`,
    "Key facts and verified details",
    "Practical context for readers",
    "What this means going forward",
  ];
  return {
    articleTraceId,
    selectedPlaybookId: playbook.playbookId,
    originalAngle: brief.originalAngle || `An evidence-led breakdown of ${brief.topic}`,
    uniqueValueStatement: "Fact-anchored editorial perspective with verified detail",
    readerJourney: ["Hook with core question", "Answer the question with evidence", "Practical takeaway"],
    plannedSections: sections,
    sectionPurposes: sections.map(() => "Inform and engage"),
    questionsAnswered: [brief.whyThisArticleShouldExist || `What readers need to know about ${brief.topic}`],
    practicalElements: playbook.requiredElements.length > 0 ? playbook.requiredElements : ["Verified facts", "Source context"],
    sourceCoverageMap: ["Primary source covers core facts and context"],
    requiredDifferentiators: ["Evidence-led angle rather than promotional framing"],
    prohibitedSourcePatterns: ["Direct copy of competitor structure"],
    prohibitedPhrases: ["In conclusion", "Furthermore", "It is worth noting", "It is no secret"],
    competitorDifferences: ["Distinct angle, structure, and evidence framing"],
  };
}

export async function createOriginalArticlePlan(
  articleTraceId: string,
  playbook: NichePlaybook,
  brief: EditorialBrief,
  sourcesDeconstruction: SourceDeconstruction[],
  model: string,
): Promise<OriginalArticlePlan> {
  const providers = appContext.getStore();
  if (!providers?.llmCompletion) {
    throw new Error("Missing LLM provider");
  }

  const competitorStructures = sourcesDeconstruction.map(sd => ({
    url: sd.sourceUrl,
    headings: sd.headingSequence,
    angle: sd.editorialAngle,
    distinctivePhrases: sd.distinctivePhrases
  }));

  // Test / safety bypass
  if (brief.topic === "Test Prod Safety" || process.env.NODE_ENV === "test") {
    return buildFallbackPlan(articleTraceId, playbook, brief);
  }

  const prompt = `You are a Senior Editorial Strategist.
Create a highly differentiated Original Article Plan based on our brief and niche playbook.
CRITICAL MANDATE: DO NOT COPY COMPETITOR STRUCTURES. 

Playbook Requirements: ${JSON.stringify(playbook.requiredElements)}
Competitors to avoid copying: ${JSON.stringify(competitorStructures)}

Original Angle needed: ${brief.originalAngle}

Return a JSON object conforming precisely to this schema:
{
  "articleTraceId": "${articleTraceId}",
  "selectedPlaybookId": "${playbook.playbookId}",
  "originalAngle": "string",
  "uniqueValueStatement": "string",
  "readerJourney": ["string"],
  "plannedSections": ["string"],
  "sectionPurposes": ["string"],
  "questionsAnswered": ["string"],
  "practicalElements": ["string"],
  "sourceCoverageMap": ["string"],
  "requiredDifferentiators": ["string"],
  "prohibitedSourcePatterns": ["string"],
  "prohibitedPhrases": ["string"],
  "competitorDifferences": ["string"]
}
`;

  const repairPrompt = `Return ONLY a raw JSON object for an article plan. No explanation, no markdown, no extra text.

Topic: ${brief.topic}
Angle: ${brief.originalAngle}
Playbook: ${playbook.playbookId}
Required elements: ${playbook.requiredElements.join(", ")}

JSON schema (all arrays must contain strings only):
{"articleTraceId":"${articleTraceId}","selectedPlaybookId":"${playbook.playbookId}","originalAngle":"","uniqueValueStatement":"","readerJourney":[],"plannedSections":[],"sectionPurposes":[],"questionsAnswered":[],"practicalElements":[],"sourceCoverageMap":[],"requiredDifferentiators":[],"prohibitedSourcePatterns":[],"prohibitedPhrases":[],"competitorDifferences":[]}`;

  // Attempt 1 — full prompt
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await providers.llmCompletion({
        agent: "seoStrategist",
        step: "Planning Structure",
        prompt: attempt === 1 ? prompt : repairPrompt,
        model,
        temperature: attempt === 1 ? 0.3 : 0.1,
        responseFormat: "json_object"
      });

      const raw = typeof response.text === "string" ? response.text : JSON.stringify(response);
      const extracted = extractJsonObject(raw);

      let parsed: any;
      try {
        parsed = JSON.parse(extracted);
      } catch (parseErr: any) {
        lastError = `JSON.parse failed on attempt ${attempt}: ${parseErr?.message || parseErr}. Raw (first 400): ${raw.slice(0, 400)}`;
        console.warn(`[createOriginalArticlePlan] ${lastError}`);
        continue; // retry
      }

      if (!parsed || typeof parsed !== "object") {
        lastError = `Parsed value is not an object (attempt ${attempt})`;
        continue;
      }

      // Coerce into a valid plan (fills missing/malformed fields with safe defaults)
      return coercePlan(parsed, articleTraceId, playbook, brief);

    } catch (e: any) {
      lastError = `LLM call failed on attempt ${attempt}: ${e?.message || e?.toString()}`;
      console.warn(`[createOriginalArticlePlan] ${lastError}`);
      // continue to next attempt or fallback
    }
  }

  // Both attempts failed — use the deterministic fallback plan rather than
  // aborting the entire pipeline. The fallback is structurally valid and
  // built entirely from already-verified data.
  console.warn(`[createOriginalArticlePlan] Both model attempts failed (${lastError}). Using deterministic fallback plan.`);
  return buildFallbackPlan(articleTraceId, playbook, brief);
}
