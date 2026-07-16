import { describe, expect, it } from "vitest";
import { assessMediaAsset } from "../imageQualityService";

const publicationPrompt = "Original editorial header showing a secure cloud deployment with abstract geometric forms and no text.";
const imagePayload = `data:image/png;base64,${"a".repeat(1_600)}`;

describe("media asset technical and provenance gate", () => {
  it("approves a usable first-party generated media asset", () => {
    expect(assessMediaAsset({
      imageUrl: imagePayload,
      source: "Google imagen-4.0-generate-001",
      prompt: publicationPrompt,
    })).toMatchObject({ approved: true, requiresManualReview: false, score: 100, assetKind: "generated" });
  });

  it("approves a first-party SVG renderer asset", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">${"<circle cx=\"20\" cy=\"20\" r=\"10\"/>".repeat(80)}</svg>`;
    expect(assessMediaAsset({
      imageUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      source: "Original SVG Renderer",
      prompt: publicationPrompt,
    })).toMatchObject({ approved: true, requiresManualReview: false, assetKind: "generated" });
  });

  it("holds fallback assets for manual review", () => {
    const result = assessMediaAsset({
      imageUrl: imagePayload,
      source: "Backup Asset",
      prompt: publicationPrompt,
      isFallback: true,
    });
    expect(result).toMatchObject({ approved: false, requiresManualReview: true });
    expect(result.reasons.join(" ")).toMatch(/fallback|unverified/i);
  });

  it("rejects reused source-article provenance", () => {
    const result = assessMediaAsset({
      imageUrl: "https://example.test/article-image.jpg",
      source: "Original Article Image",
      prompt: publicationPrompt,
    });
    expect(result.approved).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/reused source/i);
  });

  it("holds prompt-only and malformed references for review", () => {
    expect(assessMediaAsset({ imageUrl: "#prompt-only:header", source: "Manual Prompt Output", prompt: publicationPrompt }))
      .toMatchObject({ approved: false, assetKind: "prompt_only" });
    expect(assessMediaAsset({ imageUrl: "javascript:alert(1)", source: "Google Imagen", prompt: "short" }))
      .toMatchObject({ approved: false, assetKind: "invalid" });
  });
});
