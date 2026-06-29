import { NichePlaybook } from "./types";

export function selectNichePlaybook(niche: string, sourceTitle: string): NichePlaybook {
  const norm = (niche + " " + sourceTitle).toLowerCase();
  
  if (norm.includes("sports") || norm.includes("football") || norm.includes("match")) {
    return {
      playbookId: "SPORTS_NEWS_ANALYSIS",
      requiredElements: ["Match Summary", "Tactical Analysis"],
      optionalElements: ["Player Quotes", "Post-match Context"],
      prohibitedClaims: ["Unverified injury statuses", "Ref bias accusations"],
      requiredSourceTypes: ["Official Team Sites", "Accredited Reporters"],
      criticalClaimCategories: ["Scores", "Transfers"],
      toneBoundaries: ["energetic", "analytical", "objective"],
      complianceRules: ["Use bolding for team names and scores"],
      usefulReaderElements: ["Statistical tables"]
    };
  }

  if (norm.includes("travel") || norm.includes("destination") || norm.includes("hotel")) {
    return {
      playbookId: "TRAVEL_NEWS",
      requiredElements: ["Location Overview", "Practical Details"],
      optionalElements: ["Local tips", "Pricing ranges"],
      prohibitedClaims: ["Guaranteed safety", "Absolute best hidden gem"],
      requiredSourceTypes: ["Official Tourism Boards", "Verified reviews"],
      criticalClaimCategories: ["Visa rules", "Pricing"],
      toneBoundaries: ["inspiring", "practical", "descriptive"],
      complianceRules: ["Use bullet points for itineraries", "Highlight costs clearly"],
      usefulReaderElements: ["Map coordinates"]
    };
  }

  // Default playbook
  return {
    playbookId: "GENERAL_NEWS",
    requiredElements: ["Executive Summary"],
    optionalElements: ["Background context"],
    prohibitedClaims: ["in this article we will discuss", "as you can see"],
    requiredSourceTypes: ["Primary sources"],
    criticalClaimCategories: ["Statistics", "Direct quotes"],
    toneBoundaries: ["neutral", "informative", "professional"],
    complianceRules: ["Standard journalistic paragraphs", "Clear attribution"]
  };
}
