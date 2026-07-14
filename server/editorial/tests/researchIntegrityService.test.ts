import { describe, expect, it } from "vitest";
import { assessResearchIntegrity, reconcileDeclaredSourceReferences } from "../researchIntegrityService";

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

  it("allows a traceable single seed source when the active niche policy permits one", () => {
    expect(assessResearchIntegrity([sources[0]], [
      { sourceUrl: sources[0].url, verificationStatus: "verified", supportsClaim: true },
    ], 1)).toMatchObject({ passed: true, validSourceCount: 1 });
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

  it("reconciles an equivalent canonical URL to the declared RSS source", () => {
    const declared = {
      url: "https://www.dailymail.com/tvshowbiz/article-15973883/story.html?ns_mchannel=rss&ito=1490",
      title: "Declared article",
      publisher: "dailymail.com",
    };
    const reconciled = reconcileDeclaredSourceReferences(
      [{ url: "https://dailymail.com/tvshowbiz/article-15973883/story.html", title: "", publisher: "" }],
      [{ sourceUrl: "https://dailymail.com/tvshowbiz/article-15973883/story.html", verificationStatus: "verified", supportsClaim: true }],
      declared,
    );

    expect(reconciled.sources).toEqual([declared]);
    expect(reconciled.evidence[0].sourceUrl).toBe(declared.url);
    expect(assessResearchIntegrity(reconciled.sources, reconciled.evidence, 1).passed).toBe(true);
  });

  it("does not reconcile a different article or publisher", () => {
    const declared = { url: "https://news.example.org/a", title: "A", publisher: "News" };
    const reconciled = reconcileDeclaredSourceReferences(
      [{ url: "https://other.example.org/a", title: "Other", publisher: "Other" }],
      [{ sourceUrl: "https://other.example.org/a", verificationStatus: "verified", supportsClaim: true }],
      declared,
    );

    expect(reconciled.sources[0].url).toBe("https://other.example.org/a");
    expect(reconciled.evidence[0].sourceUrl).toBe("https://other.example.org/a");
  });
});
