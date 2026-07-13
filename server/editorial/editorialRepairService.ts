import { randomUUID } from "crypto";
import { appContext } from "../../server";

export type EditorialRepairRecord = {
  repairId: string;
  articleTraceId: string;
  cycle: number;
  failureType: string;
  responsibleAgent: string;
  failingPassages: string[];
  instructions: string[];
  protectedClaimIds: string[];
  beforeVersionId: string;
  afterVersionId: string;
  resolved: boolean;
  createdAt: string;
};

type RepairResult = {
  resolved: boolean;
  repairedHtml: string;
  repairRecord: EditorialRepairRecord;
};

function buildRepairRecord(
  articleTraceId: string,
  failureType: string,
  failingPassages: string[],
  repairInstructions: string[],
  claims: unknown[],
  agent: string,
  cycle: number,
  resolved: boolean
): EditorialRepairRecord {
  return {
    repairId: randomUUID(),
    articleTraceId,
    cycle,
    failureType,
    responsibleAgent: agent,
    failingPassages,
    instructions: repairInstructions,
    protectedClaimIds: claims.filter((claim): claim is string => typeof claim === "string"),
    // Article versions are created by the workflow after this service returns.
    beforeVersionId: "",
    afterVersionId: "",
    resolved,
    createdAt: new Date().toISOString(),
  };
}

function extractRepairedHtml(response: unknown): string {
  const raw = typeof response === "string"
    ? response
    : typeof (response as any)?.text === "string"
      ? (response as any).text
      : "";

  const cleaned = raw
    .trim()
    .replace(/^```(?:json|html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (!cleaned) return "";

  try {
    const parsed = JSON.parse(cleaned);
    const candidate = parsed.repairedArticleHtml
      || parsed.repairedHtml
      || parsed.articleHtml
      || parsed.content
      || parsed.html;
    return typeof candidate === "string" ? candidate.trim() : "";
  } catch {
    // A provider may return HTML despite an explicit JSON request. It is still
    // safe to pass it to the downstream claim and quality gates for rejection.
    return cleaned;
  }
}

export async function attemptRepair(
  articleTraceId: string,
  currentHtml: string,
  failureType: string,
  failingPassages: string[],
  repairInstructions: string[],
  claims: unknown[],
  agent: string,
  cycle: number
): Promise<RepairResult> {
  const providers = appContext.getStore();
  if (!providers?.llmCompletion) {
    return {
      resolved: false,
      repairedHtml: "",
      repairRecord: buildRepairRecord(
        articleTraceId,
        failureType,
        failingPassages,
        repairInstructions,
        claims,
        agent,
        cycle,
        false
      ),
    };
  }

  const prompt = `You are the Editorial Repair Specialist for a publication-quality workflow.

Repair the supplied article HTML only where necessary to resolve the listed quality failures.

Non-negotiable rules:
1. Keep the article's factual scope inside the verified claim IDs. Do not add facts, quotes, numbers, dates, names, recommendations, or first-person experiences.
2. Preserve valid HTML structure and return a complete replacement article, not a diff or commentary.
3. Replace copied or formulaic passages with a genuinely fresh editorial expression; do not imitate source phrasing or structure.
4. Apply every repair instruction without weakening the article's clarity or brand voice.
5. Return JSON only: {"repairedArticleHtml":"<article HTML>","changesSummary":["..."]}.

Article trace: ${articleTraceId}
Repair cycle: ${cycle}
Failure type: ${failureType}
Verified claim IDs that may remain in scope: ${JSON.stringify(claims)}
Failing passages: ${JSON.stringify(failingPassages)}
Repair instructions: ${JSON.stringify(repairInstructions)}

Current article HTML:
${currentHtml}`;

  try {
    const response = await providers.llmCompletion({
      agent: "Natural Style Editor",
      step: "Targeted Editorial Repair",
      prompt,
      responseFormat: "json_object",
      returnFullMetadata: true,
    });
    const repairedHtml = extractRepairedHtml(response);
    const resolved = repairedHtml.length >= 100 && repairedHtml !== currentHtml;

    return {
      resolved,
      repairedHtml: resolved ? repairedHtml : "",
      repairRecord: buildRepairRecord(
        articleTraceId,
        failureType,
        failingPassages,
        repairInstructions,
        claims,
        agent,
        cycle,
        resolved
      ),
    };
  } catch {
    return {
      resolved: false,
      repairedHtml: "",
      repairRecord: buildRepairRecord(
        articleTraceId,
        failureType,
        failingPassages,
        repairInstructions,
        claims,
        agent,
        cycle,
        false
      ),
    };
  }
}
