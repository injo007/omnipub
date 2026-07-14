import { getDocumentStore } from "../db/documentStore";
import type { ArticleFormatId } from "./articleFormatService";
import type { NichePlaybook } from "./types";

export interface NicheEditorialPolicy {
  policyId: string;
  version: number;
  nicheAliases: string[];
  playbook: NichePlaybook;
  allowedFormatIds: ArticleFormatId[];
  requiredMediaRoles: string[];
  updatedAt: string;
}

const policy = (
  policyId: string,
  nicheAliases: string[],
  playbook: NichePlaybook,
  allowedFormatIds: ArticleFormatId[],
  requiredMediaRoles: string[] = ["header"],
): NicheEditorialPolicy => ({
  policyId,
  version: 1,
  nicheAliases,
  playbook,
  allowedFormatIds,
  requiredMediaRoles,
  updatedAt: "2026-07-14T00:00:00.000Z",
});

export const BUILT_IN_NICHE_POLICIES: readonly NicheEditorialPolicy[] = [
  policy("sports", ["sports", "football", "soccer", "basketball", "match", "league"], {
    playbookId: "SPORTS_NEWS_ANALYSIS", requiredElements: ["Verified result or development", "Tactical or performance context"], optionalElements: ["Official player or coach quote", "League context"], prohibitedClaims: ["Unverified injury statuses", "Referee bias accusations", "Transfer rumours stated as fact"], requiredSourceTypes: ["Official team or league", "Accredited reporting"], criticalClaimCategories: ["Scores", "Transfers", "Injuries"], toneBoundaries: ["energetic", "analytical", "objective"], complianceRules: ["Attribute statistics", "Do not speculate on fitness or intent"], usefulReaderElements: ["Supported statistical comparison"],
  }, ["evidence_led_analysis", "chronology_brief", "comparison_brief", "reader_explainer"], ["header"]),
  policy("travel", ["travel", "destination", "hotel", "tourism", "visa", "flight"], {
    playbookId: "TRAVEL_PRACTICAL_GUIDE", requiredElements: ["Location or service context", "Verified practical details"], optionalElements: ["Clearly sourced pricing", "Accessibility information"], prohibitedClaims: ["Guaranteed safety", "Absolute best hidden gem", "Unsourced local advice"], requiredSourceTypes: ["Official tourism or transport authority", "Primary provider"], criticalClaimCategories: ["Visa rules", "Pricing", "Transport"], toneBoundaries: ["useful", "specific", "measured"], complianceRules: ["Date practical information", "Separate advice from fact"], usefulReaderElements: ["Decision criteria", "Supported itinerary bullets"],
  }, ["reader_explainer", "decision_guide", "comparison_brief", "chronology_brief"], ["header", "location-context"]),
  policy("technology", ["technology", "tech", "software", "ai", "device", "gadget", "security"], {
    playbookId: "TECH_PRODUCT_EXPLAINER", requiredElements: ["What changed", "Technical or user impact"], optionalElements: ["Supported specification comparison", "Compatibility context"], prohibitedClaims: ["Benchmarks without a source", "Future capability asserted as present"], requiredSourceTypes: ["Official documentation", "Primary announcement", "Reputable technical reporting"], criticalClaimCategories: ["Specifications", "Pricing", "Availability"], toneBoundaries: ["clear", "precise", "non-hype"], complianceRules: ["Distinguish announced from released", "Explain jargon"], usefulReaderElements: ["Compatibility matrix", "Decision criteria"],
  }, ["reader_explainer", "comparison_brief", "evidence_led_analysis", "decision_guide"], ["header", "product-context"]),
  policy("entertainment", ["entertainment", "hollywood", "film", "music", "celebrity", "tv", "streaming"], {
    playbookId: "ENTERTAINMENT_CONTEXT_REPORT", requiredElements: ["Verified development", "Career, release, or cultural context"], optionalElements: ["Official statement", "Timeline"], prohibitedClaims: ["Gossip presented as fact", "Fabricated personal motives", "Unverified relationship claims"], requiredSourceTypes: ["Official representative or studio", "Accredited entertainment publication"], criticalClaimCategories: ["Release details", "Official statements"], toneBoundaries: ["lively", "respectful", "non-invasive"], complianceRules: ["Avoid speculation", "Do not imitate a real person's voice"], usefulReaderElements: ["Release chronology", "What is confirmed"],
  }, ["evidence_led_analysis", "chronology_brief", "reader_explainer"], ["header"]),
  policy("business_finance", ["business", "finance", "market", "earnings", "economy", "investment", "startup"], {
    playbookId: "BUSINESS_EVIDENCE_BRIEF", requiredElements: ["Material development", "Numbers in context"], optionalElements: ["Comparison of disclosed figures", "Risk factors"], prohibitedClaims: ["Investment advice", "Price prediction", "Material claim without source"], requiredSourceTypes: ["Regulatory filing", "Company disclosure", "Primary data source"], criticalClaimCategories: ["Revenue", "Guidance", "Market data"], toneBoundaries: ["measured", "specific", "non-promotional"], complianceRules: ["Date figures", "Include uncertainty", "No investment recommendation"], usefulReaderElements: ["Metric explanation", "Risk memo"],
  }, ["evidence_led_analysis", "comparison_brief", "reader_explainer", "chronology_brief"], ["header", "data-context"]),
  policy("wellness", ["wellness", "health", "fitness", "nutrition", "medical"], {
    playbookId: "WELLNESS_EVIDENCE_EXPLAINER", requiredElements: ["Evidence boundary", "Practical context"], optionalElements: ["Study limitation", "When to seek qualified advice"], prohibitedClaims: ["Diagnosis", "Guaranteed outcome", "Unsourced treatment claim"], requiredSourceTypes: ["Primary research", "Public-health authority", "Qualified clinical guidance"], criticalClaimCategories: ["Health outcomes", "Dosage", "Safety"], toneBoundaries: ["careful", "helpful", "non-alarmist"], complianceRules: ["No personalised medical advice", "State evidence limits"], usefulReaderElements: ["What is known / unknown"],
  }, ["reader_explainer", "evidence_led_analysis", "decision_guide"], ["header"]),
  policy("general", ["general"], {
    playbookId: "GENERAL_EVIDENCE_REPORT", requiredElements: ["Verified core development", "Reader-relevant context"], optionalElements: ["Chronology", "Comparison"], prohibitedClaims: ["Unsourced assertion", "Generic filler"], requiredSourceTypes: ["Primary source", "Corroborating source"], criticalClaimCategories: ["Statistics", "Direct quotes"], toneBoundaries: ["neutral", "informative", "professional"], complianceRules: ["Clear attribution"], usefulReaderElements: ["What is known and unresolved"],
  }, ["evidence_led_analysis", "reader_explainer", "chronology_brief", "decision_guide"], ["header"]),
];

function builtInPolicyFor(niche: string, sourceTitle: string): NicheEditorialPolicy {
  const terms = `${niche} ${sourceTitle}`.toLowerCase();
  return BUILT_IN_NICHE_POLICIES.find((entry) => entry.policyId !== "general" && entry.nicheAliases.some((alias) => terms.includes(alias)))
    || BUILT_IN_NICHE_POLICIES.find((entry) => entry.policyId === "general")!;
}

/** Loads a workspace-overridable policy and seeds the production default on first use. */
export async function resolveNicheEditorialPolicy(niche: string, sourceTitle: string): Promise<NicheEditorialPolicy> {
  const baseline = builtInPolicyFor(niche, sourceTitle);
  const ref = getDocumentStore().collection<NicheEditorialPolicy>("niche_playbooks").doc(baseline.policyId);
  const existing = await ref.get();
  if (existing.exists) {
    return { ...baseline, ...existing.data(), playbook: { ...baseline.playbook, ...existing.data()!.playbook } };
  }
  await ref.set(baseline);
  return baseline;
}
