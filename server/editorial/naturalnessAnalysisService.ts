import { NaturalnessAnalysis } from "./types";
import { extractEditorialTextBlocks } from "./editorialTextService";

export async function analyzeNaturalness(articleTraceId: string, draftHtml: string): Promise<NaturalnessAnalysis> {
  const blocks = extractEditorialTextBlocks(draftHtml);
  const paragraphs = blocks.paragraphs;
  const text = blocks.text;
  const sentences = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
  
  let passed = true;
  let detectedPatterns: string[] = [];
  let repairInstructions: string[] = [];
  const failingPassages: string[] = [];
  let naturalnessScore = 100;
  let formulaicCount = 0;
  
  const totalLength = text.length;
  const isShort = totalLength < 1000;
  const markerPenalty = (pattern: string, instruction: string, passage: string, weight = 1) => {
      detectedPatterns.push(pattern);
      repairInstructions.push(instruction);
      if (passage) failingPassages.push(passage);
      formulaicCount += weight;
  };
  
  // 1. Formulaic introduction
  if (paragraphs.length > 0 && paragraphs[0].match(/^(In today's|Welcome to|In the ever-evolving|It is no secret that)/i)) {
      markerPenalty("Formulaic introduction", "Rewrite the introduction to be more direct and natural.", paragraphs[0]);
  }

  // 2. Generic conclusion
  if (paragraphs.length > 1 && paragraphs[paragraphs.length - 1].match(/^(In conclusion|Ultimately|To sum up|All in all)/i)) {
      markerPenalty("Generic conclusion", "Remove formulaic concluding transitions.", paragraphs[paragraphs.length - 1]);
  }

  // 3. Repeated transitions
  const transitions = ['furthermore', 'moreover', 'additionally', 'however', 'consequently'];
  let transitionCount = 0;
  for (const t of transitions) {
      const regex = new RegExp(`\\b${t}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) transitionCount += matches.length;
  }
  if (transitionCount > (isShort ? 2 : 4)) {
      markerPenalty("Repeated transitions", "Vary paragraph transitions and reduce robotic connectors.", paragraphs.find((paragraph) => transitions.some((transition) => new RegExp(`\\b${transition}\\b`, "i").test(paragraph))) || text);
  }

  // 4. Repeated sentence openings
  const openings = sentences.map(s => s.trim().split(" ")[0].toLowerCase());
  const openingFreq = openings.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {} as Record<string, number>);
  const maxAllowedOpenings = isShort ? 3 : 6;
  for (const [word, count] of Object.entries(openingFreq)) {
      if (count > maxAllowedOpenings && !['the', 'a', 'it', 'he', 'she', 'they', 'i', 'we'].includes(word)) {
          markerPenalty("Repeated sentence openings", `Vary sentence starts. You started sentences with '${word}' ${count} times.`, sentences.filter((sentence) => sentence.trim().toLowerCase().startsWith(`${word} `)).slice(0, 2).join(" "));
          break;
      }
  }

  // 5. Uniform sentence lengths
  const sentenceLengths = sentences.map(s => s.split(" ").length);
  if (sentenceLengths.length > 5) {
      const avg = sentenceLengths.reduce((a,b) => a+b, 0) / sentenceLengths.length;
      const variance = sentenceLengths.reduce((a,b) => a + Math.pow(b - avg, 2), 0) / sentenceLengths.length;
      if (variance < 5) {
          markerPenalty("Uniform sentence lengths", "Vary sentence lengths to create natural rhythm.", sentences.slice(0, 3).join(" "));
      }
  }

  // 6. Repetitive paragraph patterns
  const pLengths = paragraphs.map(p => p.split(" ").length);
  if (pLengths.length > 4) {
      const avgP = pLengths.reduce((a,b) => a+b, 0) / pLengths.length;
      const varP = pLengths.reduce((a,b) => a + Math.pow(b - avgP, 2), 0) / pLengths.length;
      if (varP < 10) {
          markerPenalty("Repetitive paragraph patterns", "Vary paragraph sizes. Avoid robotic uniform blocking.", paragraphs.slice(0, 3).join(" "));
      }
  }

  // 7. Mechanical list construction
  if (blocks.listItemCount > (isShort ? 5 : 10) && paragraphs.length < 3) {
      markerPenalty("Mechanical list construction", "Integrate list points into natural prose paragraphs.", "List-heavy article with insufficient explanatory prose.");
  }

  // 8. Excessive rhetorical questions
  const questions = sentences.filter(s => s.trim().endsWith("?"));
  if (questions.length > (isShort ? 2 : 4)) {
      markerPenalty("Excessive rhetorical questions", "Reduce the number of rhetorical questions.", questions.slice(0, 3).join(" "));
  }

  // 9. Unnatural keyword repetition
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const wordFreq = words.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {} as Record<string, number>);
  // Skip common names or niche concepts
  const exclusions = ['football', 'match', 'game', 'player', 'team', 'apple', 'google'];
  const maxKeywordRep = isShort ? 6 : 12;
  for (const [word, count] of Object.entries(wordFreq)) {
      if (count > maxKeywordRep && !exclusions.includes(word)) {
          markerPenalty("Unnatural keyword repetition", `Reduce repetition of the word '${word}'.`, sentences.filter((sentence) => new RegExp(`\\b${word}\\b`, "i").test(sentence)).slice(0, 2).join(" "));
          break;
      }
  }

  const aiTellPatterns: Array<{ label: string; pattern: RegExp; instruction: string; weight?: number }> = [
      { label: "AI filler phrase", pattern: /\b(?:at its core|it is important to note|it is worth noting|in a world where|as we look to the future|not merely an? .+? but an?|delve(?:s|d)? into|testament to|paving the way|rapidly evolving|game changer|unlock(?:s|ing)? the potential)\b/i, instruction: "Remove stock AI editorial phrasing and state the supported point directly.", weight: 4 },
      { label: "Vague value language", pattern: /\b(?:vibrant|tapestry|transformative|crucial|seamless|robust|dynamic|innovative|holistic|cutting-edge|next-level)\b/i, instruction: "Replace vague praise words with concrete, source-backed details.", weight: 1 },
      { label: "Generic reader promise", pattern: /\b(?:readers can expect|this article explores|we'?ll explore|we will discuss|this piece takes a closer look)\b/i, instruction: "Open with the specific news value instead of announcing the article's task.", weight: 2 },
  ];
  for (const paragraph of paragraphs) {
      for (const marker of aiTellPatterns) {
          if (marker.pattern.test(paragraph)) {
              markerPenalty(marker.label, marker.instruction, paragraph, marker.weight || 1);
              break;
          }
      }
  }

  const genericParagraphs = paragraphs.filter((paragraph) => {
      const longWords = paragraph.toLowerCase().match(/[a-z0-9]{5,}/g) || [];
      const concreteSignals = paragraph.match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|\d+(?:[.,]\d+)?%?|\$|£|€|20\d{2}|19\d{2})\b/g) || [];
      const genericSignals = paragraph.match(/\b(?:experience|landscape|journey|solution|offering|approach|ecosystem|audience|industry|community|content|quality|engagement)\b/gi) || [];
      return paragraph.split(/\s+/).length >= 35 && concreteSignals.length === 0 && genericSignals.length >= 2 && new Set(longWords).size < longWords.length * 0.72;
  });
  if (genericParagraphs.length > 0) {
      markerPenalty("Generic low-specificity paragraph", "Replace broad filler with named facts, practical consequences, or clearly bounded uncertainty.", genericParagraphs[0], 2);
  }

  naturalnessScore = Math.max(0, 100 - (formulaicCount * 10));
  if (formulaicCount > 3) passed = false;

  const averageSentenceLength = sentenceLengths.length ? sentenceLengths.reduce((sum, length) => sum + length, 0) / sentenceLengths.length : 0;
  const sentenceVariance = sentenceLengths.length
    ? sentenceLengths.reduce((sum, length) => sum + Math.pow(length - averageSentenceLength, 2), 0) / sentenceLengths.length
    : 0;
  const lexicalTokens = text.toLowerCase().match(/[a-z0-9]{4,}/g) || [];
  const lexicalDiversity = lexicalTokens.length ? new Set(lexicalTokens).size / lexicalTokens.length : 0;

  return {
    articleTraceId,
    passed,
    naturalnessScore,
    rhythmScore: Math.min(100, Math.round(sentenceVariance * 5)),
    voiceConsistencyScore: Math.max(0, 100 - (formulaicCount * 8)),
    specificityScore: Math.round(lexicalDiversity * 100),
    repetitionScore: Math.max(0, 100 - (formulaicCount * 15)),
    failingPassages: failingPassages.filter(Boolean),
    detectedPatterns,
    repairInstructions,
    aiMarkersDetected: formulaicCount
  } as any;
}
