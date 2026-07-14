import { describe, expect, it } from "vitest";
import { extractEditorialTextBlocks } from "../editorialTextService";

describe("editorial text extraction", () => {
  it("extracts headings, prose, and list volume from Markdown", () => {
    const blocks = extractEditorialTextBlocks("# Title\n\nOpening paragraph.\n\n## What changed\n\nDetailed explanation.\n\n- First point\n- Second point");
    expect(blocks.headings).toEqual(["Title", "What changed"]);
    expect(blocks.paragraphs).toEqual(["Opening paragraph.", "Detailed explanation."]);
    expect(blocks.listItemCount).toBe(2);
  });

  it("continues to support legacy HTML", () => {
    const blocks = extractEditorialTextBlocks("<h2>Context</h2><p>Verified context.</p><ul><li>One</li></ul>");
    expect(blocks.headings).toEqual(["Context"]);
    expect(blocks.paragraphs).toEqual(["Verified context."]);
    expect(blocks.listItemCount).toBe(1);
  });
});
