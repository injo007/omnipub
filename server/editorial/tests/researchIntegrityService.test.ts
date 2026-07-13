import { describe, expect, it } from "vitest";
import { assessResearchIntegrity } from "../researchIntegrityService";

const sources = [
  { url: "https://primary.example-news.org/report", title: "Primary reporting", publisher: "Example News" },
  { url: "https://records.example-government.gov/item", title: "Public record", publisher: "Public Records" },
];

describe("research integrity gate", () => {
  it("accepts evidence that is traceable to declared HTTPS sources", () => {
    expect(assessResearchIntegrity(sources, [
      { sourceUrl: sources[0].url, verificationStatus: "verified", supportsClaim: true },
    ], 2)).toMatchObject({ passed: true, validSourceCount: 2 });
  });

  it("rejects placeholder, incomplete, and unlinked evidence", () => {
    const result = assessResearchIntegrity([
      { url: "https://example.com/source", title: "Placeholder", publisher: "Placeholder" },
      { url: "http://insecure.example.org", title: "Insecure", publisher: "Example" },
    ], [
      { sourceUrl: "https://unrelated.example.org", verificationStatus: "verified", supportsClaim: true },
    ], 2);
    expect(result.passed).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });
});
