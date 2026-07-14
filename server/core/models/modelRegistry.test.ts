import { describe, expect, it } from "vitest";
import { resolveModelRoute } from "./modelRegistry";

describe("model registry", () => {
  it("routes native Gemini model identifiers to Gemini", () => {
    expect(resolveModelRoute("gemini-2.5-flash")).toMatchObject({ provider: "gemini", capabilities: ["text", "json"] });
  });

  it("routes direct MiniMax identifiers to MiniMax", () => {
    expect(resolveModelRoute("MiniMax-M3")).toMatchObject({ provider: "minimax", modelId: "MiniMax-M3" });
    expect(resolveModelRoute("minimax/abab7-chat")).toMatchObject({ provider: "minimax" });
  });

  it("routes third-party model slugs through OpenRouter", () => {
    expect(resolveModelRoute("anthropic/claude-3.5-sonnet")).toMatchObject({ provider: "openrouter" });
    expect(resolveModelRoute("cohere/north-mini-code:free")).toMatchObject({ provider: "openrouter" });
  });

  it("honors explicit provider prefixes for unambiguous administration", () => {
    expect(resolveModelRoute("openrouter:google/gemini-2.5-flash")).toMatchObject({
      provider: "openrouter",
      modelId: "google/gemini-2.5-flash",
    });
    expect(resolveModelRoute("minimax:MiniMax-M3")).toMatchObject({ provider: "minimax", modelId: "MiniMax-M3" });
    expect(resolveModelRoute("openai:gpt-4.1")).toMatchObject({ provider: "openai", modelId: "gpt-4.1" });
  });
});
