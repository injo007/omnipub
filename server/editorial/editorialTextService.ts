import { parseHTML } from "linkedom";

export interface EditorialTextBlocks {
  paragraphs: string[];
  headings: string[];
  listItemCount: number;
  text: string;
}

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Extracts comparable prose blocks from either Markdown or legacy HTML. */
export function extractEditorialTextBlocks(content: string): EditorialTextBlocks {
  const isHtml = /<\/?(?:p|h[1-6]|li|div|article|section)\b/i.test(content);
  if (isHtml) {
    const { document } = parseHTML(`<article>${content}</article>`);
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .map((element) => clean(element.textContent || ""))
      .filter(Boolean);
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map((element) => clean(element.textContent || ""))
      .filter(Boolean);
    const listItemCount = document.querySelectorAll("li").length;
    const text = clean(document.querySelector("article")?.textContent || content);
    return { paragraphs: paragraphs.length ? paragraphs : text ? [text] : [], headings, listItemCount, text };
  }

  const headings: string[] = [];
  const paragraphs: string[] = [];
  let listItemCount = 0;
  let paragraphLines: string[] = [];
  const flushParagraph = () => {
    const paragraph = clean(paragraphLines.join(" "));
    if (paragraph) paragraphs.push(paragraph);
    paragraphLines = [];
  };

  for (const rawLine of content.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); continue; }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) { flushParagraph(); headings.push(clean(heading[1])); continue; }
    if (/^(?:[-*+]\s+|\d+\.\s+)/.test(line)) { flushParagraph(); listItemCount++; continue; }
    if (/^>|^\|/.test(line) || /^```/.test(line)) { flushParagraph(); continue; }
    paragraphLines.push(line.replace(/!?(?:\[[^\]]*\]\([^)]*\))|[*_`]/g, ""));
  }
  flushParagraph();
  const text = clean([...headings, ...paragraphs].join(" "));
  return { paragraphs, headings, listItemCount, text };
}
