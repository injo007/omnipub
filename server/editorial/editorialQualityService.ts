import { EditorialQualityScore, OriginalityAnalysis, NaturalnessAnalysis, WriterVoiceValidation } from "./types";
import { randomUUID as uuidv4 } from "crypto";

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
  let factualScore = 20;
  if (!validationResult.passed) factualScore -= 5;
  if (validationResult.unsupportedPassages?.length > 0) factualScore -= 10;
  
  let originalityScore = originality.passed ? 15 : (originality.overallOriginalityScore / 100) * 15;
  let voiceScore = writerVoice.passed ? 10 : (writerVoice.voiceConsistencyScore / 100) * 10;
  let readerUsefulness = 15;
  if (!playbookPassed) readerUsefulness -= 5;

  let structureScore = 10;
  let nicheExpertise = 10;
  let seoScore = 5;
  let transparency = 5;
  let reportingScore = 10;

  let totalScore = factualScore + readerUsefulness + originalityScore + reportingScore + voiceScore + structureScore + nicheExpertise + seoScore + transparency;

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
      readerUsefulness: { score: readerUsefulness, max: 15 },
      structureScore: { score: structureScore, max: 10 },
      nicheExpertise: { score: nicheExpertise, max: 10 },
      seoScore: { score: seoScore, max: 5 },
      transparency: { score: transparency, max: 5 },
      reportingScore: { score: reportingScore, max: 10 }
    },
    blockingFailures,
    repairRecommendations
  };
}
