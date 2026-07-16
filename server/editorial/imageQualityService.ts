export interface MediaAssetAssessmentInput {
  imageUrl: string;
  source: string;
  prompt: string;
  isFallback?: boolean;
}

export interface MediaAssetAssessment {
  score: number;
  approved: boolean;
  requiresManualReview: boolean;
  assetKind: "generated" | "prompt_only" | "missing" | "invalid";
  reasons: string[];
}

const REJECTED_SOURCE_PATTERNS = [
  /original article/i,
  /backup asset/i,
  /deterministic backup/i,
  /unsplash/i,
  /source crawl/i,
  /recycled/i,
];

/**
 * A deterministic technical and provenance gate for generated media.
 *
 * This deliberately does not pretend to judge artistic merit from a URL. It
 * verifies that an asset was generated through an approved workflow, is
 * usable by the publisher, and has no known unlicensed/reused provenance.
 */
export function assessMediaAsset(input: MediaAssetAssessmentInput): MediaAssetAssessment {
  const imageUrl = input.imageUrl.trim();
  const source = input.source.trim();
  const prompt = input.prompt.trim();
  const reasons: string[] = [];
  let score = 100;

  if (!imageUrl) {
    return {
      score: 0,
      approved: false,
      requiresManualReview: true,
      assetKind: "missing",
      reasons: ["No media asset was produced."],
    };
  }

  if (imageUrl.startsWith("#prompt-only:")) {
    return {
      score: 0,
      approved: false,
      requiresManualReview: true,
      assetKind: "prompt_only",
      reasons: ["Prompt-only media requires a human to create and approve the final asset."],
    };
  }

  const isImageDataUrl = /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i.test(imageUrl);
  const isHttpsUrl = /^https:\/\//i.test(imageUrl);
  if (!isImageDataUrl && !isHttpsUrl) {
    reasons.push("The media reference is neither an image data URL nor an HTTPS URL.");
    score -= 100;
  }

  if (isImageDataUrl && imageUrl.length < 1_500) {
    reasons.push("The generated image payload is too small to be a reliable publication asset.");
    score -= 50;
  }

  if (!source) {
    reasons.push("The generating provider and provenance were not recorded.");
    score -= 45;
  }

  if (REJECTED_SOURCE_PATTERNS.some((pattern) => pattern.test(source))) {
    reasons.push("The asset source is a fallback, reused source, or unverified stock reference.");
    score -= 100;
  }

  if (input.isFallback) {
    reasons.push("The image was returned by a fallback path and requires human rights and quality review.");
    score -= 70;
  }

  if (prompt.length < 24) {
    reasons.push("The generation prompt is too short to provide meaningful editorial provenance.");
    score -= 25;
  }

  score = Math.max(0, score);
  const approved = reasons.length === 0 && score >= 75;
  return {
    score,
    approved,
    requiresManualReview: !approved,
    assetKind: approved ? "generated" : "invalid",
    reasons,
  };
}
