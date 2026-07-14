import crypto from "crypto";

export type ArticleFormatId =
  | "evidence_led_analysis"
  | "reader_explainer"
  | "chronology_brief"
  | "comparison_brief"
  | "decision_guide";

export interface ArticleFormatProfile {
  id: ArticleFormatId;
  label: string;
  openingInstruction: string;
  structureInstruction: string;
  editorInstruction: string;
  requiredElements: string[];
  forbiddenPatterns: string[];
}

const FORMAT_PROFILES: readonly ArticleFormatProfile[] = [
  {
    id: "evidence_led_analysis",
    label: "Evidence-led analysis",
    openingInstruction: "Open on the central tension or consequence, then establish only the verified facts needed to understand it.",
    structureInstruction: "Develop two or three analytical sections that move from what happened, to why the evidence matters, to what remains uncertain. Do not add a summary-for-summary's-sake ending.",
    editorInstruction: "Preserve the analytical through-line and vary the depth of each section; do not flatten it into a generic recap.",
    requiredElements: ["central tension", "evidence-led implications", "explicit uncertainty where relevant"],
    forbiddenPatterns: ["generic conclusion", "invented expert quote", "decorative table"],
  },
  {
    id: "reader_explainer",
    label: "Reader explainer",
    openingInstruction: "Answer the reader's most likely practical question in the first paragraph, then unpack the terms or mechanics behind it.",
    structureInstruction: "Use question-led H2s or compact explanatory sections. Include a short 'What we know / What is unresolved' split only when both are supported by the ledger.",
    editorInstruction: "Keep definitions and transitions plainspoken. Retain the answer-first architecture rather than converting it into a news recap.",
    requiredElements: ["answer-first opening", "clear explanation of mechanics", "bounded uncertainty"],
    forbiddenPatterns: ["scene-setting cliché", "unsupported advice", "formulaic conclusion"],
  },
  {
    id: "chronology_brief",
    label: "Chronology brief",
    openingInstruction: "Open with the latest verified development, then orient the reader in time without dramatizing events not present in the evidence.",
    structureInstruction: "Use a chronological sequence with concise dated milestones only where the ledger supports dates. Follow it with one context section explaining the significance.",
    editorInstruction: "Keep the temporal order obvious and remove any date or sequence that is not supported by the ledger.",
    requiredElements: ["latest development", "verified chronology", "context after chronology"],
    forbiddenPatterns: ["invented timeline entry", "undated speculation", "generic recap"],
  },
  {
    id: "comparison_brief",
    label: "Comparison brief",
    openingInstruction: "Name the meaningful contrast immediately and explain why a reader should care about the distinction.",
    structureInstruction: "Compare only attributes that are explicitly present in the evidence ledger. A small Markdown table is allowed only when it improves a supported comparison; otherwise use parallel prose sections.",
    editorInstruction: "Preserve clear criteria and avoid manufacturing winners, scores, or missing dimensions.",
    requiredElements: ["comparison criteria", "supported contrast", "reader implication"],
    forbiddenPatterns: ["unsupported ranking", "decorative table", "false equivalence"],
  },
  {
    id: "decision_guide",
    label: "Decision guide",
    openingInstruction: "Start with the decision or trade-off facing the reader, not a dramatic news hook.",
    structureInstruction: "Organize the article around practical decision criteria, then explain the evidence behind each criterion. Use bullets only for genuinely scannable choices.",
    editorInstruction: "Keep recommendations conditional on the reader's needs and do not turn verified facts into universal advice.",
    requiredElements: ["reader decision", "criteria", "conditional takeaways"],
    forbiddenPatterns: ["one-size-fits-all advice", "fake urgency", "generic conclusion"],
  },
];

export function selectArticleFormat(input: {
  articleTraceId: string;
  readerIntent?: string;
  evidenceLedger?: Array<{ sourceDate?: string; sourceUrl?: string }>;
  recentFormatIds?: string[];
  allowedFormatIds?: ArticleFormatId[];
}): ArticleFormatProfile {
  const recent = new Set(input.recentFormatIds || []);
  const allowed = input.allowedFormatIds?.length ? new Set(input.allowedFormatIds) : null;
  const viable = FORMAT_PROFILES.filter((profile) => {
    if (allowed && !allowed.has(profile.id)) return false;
    if (profile.id === "chronology_brief") return (input.evidenceLedger || []).some((entry) => Boolean(entry.sourceDate));
    if (profile.id === "comparison_brief") return new Set((input.evidenceLedger || []).map((entry) => entry.sourceUrl).filter(Boolean)).size >= 2;
    return true;
  });
  const unused = viable.filter((profile) => !recent.has(profile.id));
  const pool = unused.length > 0 ? unused : viable;
  const hash = crypto.createHash("sha256").update(`${input.articleTraceId}:${input.readerIntent || ""}`).digest();
  return pool[hash[0] % pool.length] || FORMAT_PROFILES[0];
}

export function getArticleFormatProfile(formatId: string | undefined): ArticleFormatProfile | undefined {
  return FORMAT_PROFILES.find((profile) => profile.id === formatId);
}
