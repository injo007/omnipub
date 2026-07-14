import { describe, expect, it } from "vitest";
import { selectArticleFormat } from "../articleFormatService";

const ledger = [
  { sourceDate: "2026-07-01", sourceUrl: "https://news.example.org/a" },
  { sourceDate: "2026-07-02", sourceUrl: "https://records.example.gov/b" },
];

describe("article format selection", () => {
  it("uses an unused viable format before repeating a recent format", () => {
    const format = selectArticleFormat({
      articleTraceId: "trace-format-a",
      evidenceLedger: ledger,
      recentFormatIds: ["evidence_led_analysis", "reader_explainer"],
    });
    expect(["chronology_brief", "comparison_brief", "decision_guide"]).toContain(format.id);
  });

  it("does not select a chronology or comparison format without supporting evidence", () => {
    const format = selectArticleFormat({ articleTraceId: "trace-format-b", evidenceLedger: [] });
    expect(["evidence_led_analysis", "reader_explainer", "decision_guide"]).toContain(format.id);
  });
});
