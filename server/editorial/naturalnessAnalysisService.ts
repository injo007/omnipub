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
  
  // 1. Formulaic introduction
  if (paragraphs.length > 0 && paragraphs[0].match(/^(In today's|Welcome to|In the ever-evolving|It is no secret that)/i)) {
      detectedPatterns.push("Formulaic introduction");
      repairInstructions.push("Rewrite the introduction to be more direct and natural.");
      failingPassages.push(paragraphs[0]);
      formulaicCount++;
  }

  // 2. Generic conclusion
  if (paragraphs.length > 1 && paragraphs[paragraphs.length - 1].match(/^(In conclusion|Ultimately|To sum up|All in all)/i)) {
      detectedPatterns.push("Generic conclusion");
      repairInstructions.push("Remove formulaic concluding transitions.");
      failingPassages.push(paragraphs[paragraphs.length - 1]);
      formulaicCount++;
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
      detectedPatterns.push("Repeated transitions");
      repairInstructions.push("Vary paragraph transitions and reduce robotic connectors.");
      failingPassages.push(paragraphs.find((paragraph) => transitions.some((transition) => new RegExp(`\\b${transition}\\b`, "i").test(paragraph))) || text);
      formulaicCount++;
  }

  // 4. Repeated sentence openings
  const openings = sentences.map(s => s.trim().split(" ")[0].toLowerCase());
  const openingFreq = openings.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {} as Record<string, number>);
  const maxAllowedOpenings = isShort ? 3 : 6;
  for (const [word, count] of Object.entries(openingFreq)) {
      if (count > maxAllowedOpenings && !['the', 'a', 'it', 'he', 'she', 'they', 'i', 'we'].includes(word)) {
          detectedPatterns.push("Repeated sentence openings");
          repairInstructions.push(`Vary sentence starts. You started sentences with '${word}' ${count} times.`);
          failingPassages.push(sentences.filter((sentence) => sentence.trim().toLowerCase().startsWith(`${word} `)).slice(0, 2).join(" "));
          formulaicCount++;
          break;
      }
  }

  // 5. Uniform sentence lengths
  const sentenceLengths = sentences.map(s => s.split(" ").length);
  if (sentenceLengths.length > 5) {
      const avg = sentenceLengths.reduce((a,b) => a+b, 0) / sentenceLengths.length;
      const variance = sentenceLengths.reduce((a,b) => a + Math.pow(b - avg, 2), 0) / sentenceLengths.length;
      if (variance < 5) {
          detectedPatterns.push("Uniform sentence lengths");
          repairInstructions.push("Vary sentence lengths to create natural rhythm.");
          failingPassages.push(sentences.slice(0, 3).join(" "));
          formulaicCount++;
      }
  }

  // 6. Repetitive paragraph patterns
  const pLengths = paragraphs.map(p => p.split(" ").length);
  if (pLengths.length > 4) {
      const avgP = pLengths.reduce((a,b) => a+b, 0) / pLengths.length;
      const varP = pLengths.reduce((a,b) => a + Math.pow(b - avgP, 2), 0) / pLengths.length;
      if (varP < 10) {
          detectedPatterns.push("Repetitive paragraph patterns");
          repairInstructions.push("Vary paragraph sizes. Avoid robotic uniform blocking.");
          failingPassages.push(paragraphs.slice(0, 3).join(" "));
          formulaicCount++;
      }
  }

  // 7. Mechanical list construction
  if (blocks.listItemCount > (isShort ? 5 : 10) && paragraphs.length < 3) {
      detectedPatterns.push("Mechanical list construction");
      repairInstructions.push("Integrate list points into natural prose paragraphs.");
      failingPassages.push("List-heavy article with insufficient explanatory prose.");
      formulaicCount++;
  }

  // 8. Excessive rhetorical questions
  const questions = sentences.filter(s => s.trim().endsWith("?"));
  if (questions.length > (isShort ? 2 : 4)) {
      detectedPatterns.push("Excessive rhetorical questions");
      repairInstructions.push("Reduce the number of rhetorical questions.");
      failingPassages.push(questions.slice(0, 3).join(" "));
      formulaicCount++;
  }

  // 9. Unnatural keyword repetition
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const wordFreq = words.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {} as Record<string, number>);
  // Skip common names or niche concepts
  const exclusions = ['football', 'match', 'game', 'player', 'team', 'apple', 'google'];
  const maxKeywordRep = isShort ? 6 : 12;
  for (const [word, count] of Object.entries(wordFreq)) {
      if (count > maxKeywordRep && !exclusions.includes(word)) {
          detectedPatterns.push("Unnatural keyword repetition");
          repairInstructions.push(`Reduce repetition of the word '${word}'.`);
          failingPassages.push(sentences.filter((sentence) => new RegExp(`\\b${word}\\b`, "i").test(sentence)).slice(0, 2).join(" "));
          formulaicCount++;
          break;
      }
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
