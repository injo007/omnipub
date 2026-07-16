import { EditorialQualityScore, OriginalityAnalysis, NaturalnessAnalysis, WriterVoiceValidation } from "./types";

function clampScore(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

function percentToPoints(value: number | undefined, max: number): number {
  return clampScore(((value ?? 0) / 100) * max, max);
}

export function evaluateEditorialQuality(
  articleTraceId: string,
  validationResult: any,
  originality: OriginalityAnalysis,
  naturalness: NaturalnessAnalysis,
  writerVoice: WriterVoiceValidation,
  playbookPassed: boolean,
  isFresh: boolean,
  compliancePassed: boolean,
  noFabrication: boolean
): EditorialQualityScore {
  const unsupportedCount = validationResult.unsupportedPassages?.length || 0;
  const unknownClaimCount = validationResult.unknownClaimIds?.length || 0;

  let factualScore = 20;
  if (!validationResult.passed) factualScore -= 4;
  factualScore -= Math.min(12, unsupportedCount * 4);
  factualScore -= Math.min(6, unknownClaimCount * 2);
  factualScore = clampScore(factualScore, 20);
  
  const originalityScore = originality.passed
    ? percentToPoints(Math.max(originality.overallOriginalityScore, 90), 15)
    : percentToPoints(originality.overallOriginalityScore, 15);
  const voiceScore = writerVoice.passed
    ? percentToPoints(Math.max(writerVoice.voiceConsistencyScore, 85), 10)
    : percentToPoints(writerVoice.voiceConsistencyScore, 10);

  const naturalnessPoints = percentToPoints(naturalness.naturalnessScore, 10);
  let readerUsefulness = 15;
  if (!playbookPassed) readerUsefulness -= 5;
  readerUsefulness -= Math.min(6, (naturalness.detectedPatterns?.filter((pattern) => /generic|filler|vague|low-specificity/i.test(pattern)).length || 0) * 2);
  readerUsefulness = clampScore(readerUsefulness, 15);

  let structureScore = playbookPassed ? 8 : 4;
  let nicheExpertise = playbookPassed ? 7 : 4;
  let seoScore = 5;
  let transparency = validationResult.mappedClaimIds?.length > 0 ? 5 : 3;
  let reportingScore = finalReportingScore(validationResult, compliancePassed, noFabrication);

  let totalScore = factualScore + readerUsefulness + originalityScore + reportingScore + voiceScore + naturalnessPoints + structureScore + nicheExpertise + seoScore + transparency;

  const blockingFailures: string[] = [];
  const repairRecommendations: string[] = [];

  // Critical Gates
  if (!naturalness.passed) blockingFailures.push("Naturalness checks failed.");
  if (!originality.passed) blockingFailures.push("Originality checks failed.");
  if (!playbookPassed) blockingFailures.push("Playbook constraints failed.");
  if (!isFresh) blockingFailures.push("Freshness constraints failed.");
  if (!compliancePassed) blockingFailures.push("Critical compliance failure.");
  if (!noFabrication) blockingFailures.push("Fabricated experience/quotation detected.");
  if (validationResult.unsupportedPassages?.length > 0) blockingFailures.push("Unsupported critical claim detected.");

  if (totalScore < 85) blockingFailures.push("Total score below 85.");
  if (factualScore < 18) blockingFailures.push("Factual accuracy below 18/20.");
  if (readerUsefulness < 12) blockingFailures.push("Reader usefulness below 12/15.");
  if (originalityScore < 12) blockingFailures.push("Original angle below 12/15.");
  if (voiceScore < 8) blockingFailures.push("Natural voice below 8/10.");
  if (naturalnessPoints < 8) blockingFailures.push("Editorial naturalness below 8/10.");

  if (!validationResult.passed) repairRecommendations.push("Remove unsupported claims and keep only facts mapped to ledger claim IDs.");
  if (!naturalness.passed || naturalnessPoints < 8) repairRecommendations.push("Replace formulaic phrasing with concrete source-led sentences and varied rhythm.");
  if (!originality.passed) repairRecommendations.push("Restructure copied or close-paraphrased passages around a different reader question.");
  if (!playbookPassed) repairRecommendations.push("Refit the article to the selected niche playbook and article format.");

  const passed = blockingFailures.length === 0;

  // Log Observability
  console.log(JSON.stringify({
      articleId: articleTraceId,
      validationStage: "EDITORIAL_QUALITY",
      metric: "TOTAL_SCORE",
      rawScore: totalScore,
      threshold: 85,
      action: passed ? "PASSED" : "BLOCKED",
      detectedEvidenceSummary: blockingFailures.join("; "),
      terminalState: passed ? "PASSED" : "NEEDS_MANUAL_REVIEW",
      timestamp: new Date().toISOString()
  }));

  return {
    articleTraceId,
    totalScore,
    passed,
    dimensions: {
      factualScore: { score: factualScore, max: 20 },
      originalityScore: { score: originalityScore, max: 15 },
      voiceScore: { score: voiceScore, max: 10 },
      naturalnessScore: { score: naturalnessPoints, max: 10 },
      readerUsefulness: { score: readerUsefulness, max: 15 },
      structureScore: { score: structureScore, max: 8 },
      nicheExpertise: { score: nicheExpertise, max: 7 },
      seoScore: { score: seoScore, max: 5 },
      transparency: { score: transparency, max: 5 },
      reportingScore: { score: reportingScore, max: 5 }
    },
    blockingFailures,
    repairRecommendations
  };
}

function finalReportingScore(validationResult: any, compliancePassed: boolean, noFabrication: boolean): number {
  let score = 5;
  if (!compliancePassed) score -= 2;
  if (!noFabrication) score -= 3;
  if (validationResult.requiresResearch) score -= 1;
  return clampScore(score, 5);
}
