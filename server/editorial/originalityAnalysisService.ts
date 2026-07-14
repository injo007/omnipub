import { OriginalityAnalysis, SourceDeconstruction } from "./types";
import { extractEditorialTextBlocks } from "./editorialTextService";

const EXCLUSION_WORDS = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'was', 'at', 'by', 'an', 'be', 'this', 'which', 'or', 'from', 'but', 'not', 'are', 'were', 'have', 'had', 'has', 'they', 'their', 'we', 'our', 'you', 'your', 'he', 'his', 'she', 'her', 'it', 'its']);
const COMMON_NICHE_TERMS = new Set(['football', 'match', 'goal', 'team', 'stadium', 'league', 'player', 'travel', 'hotel', 'flight', 'destination']);

function extractQuotations(text: string): string[] {
    const quotes = text.match(/"([^"]+)"/g) || [];
    return quotes.map(q => q.replace(/"/g, ''));
}

function normalizePunctuation(text: string): string {
    return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ").trim().toLowerCase();
}

function jaccardSimilarity(str1: string, str2: string) {
    const quotes1 = extractQuotations(str1);
    let s1Text = str1;
    let s2Text = str2;
    quotes1.forEach(q => {
        s1Text = s1Text.replace(q, ''); 
        s2Text = s2Text.replace(q, ''); 
    });
    
    const s1Words = s1Text.toLowerCase().split(/\W+/).filter(w => w && !EXCLUSION_WORDS.has(w) && !COMMON_NICHE_TERMS.has(w));
    const s2Words = s2Text.toLowerCase().split(/\W+/).filter(w => w && !EXCLUSION_WORDS.has(w) && !COMMON_NICHE_TERMS.has(w));
    
    if (s1Words.length < 5 || s2Words.length < 5) return 0; // minimum reliable comparison length

    const s1 = new Set(s1Words);
    const s2 = new Set(s2Words);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

export async function analyzeOriginality(
  articleTraceId: string,
  draftHtml: string,
  sources: SourceDeconstruction[]
): Promise<OriginalityAnalysis> {
  let passed = true;
  let overallOriginalityScore = 100;
  const failingPassages: { sourceId: string; paragraphText: string; similarityType: string; similarityScore: number }[] = [];
  const repairInstructions: string[] = [];

  const draftBlocks = extractEditorialTextBlocks(draftHtml);
  const draftParagraphs = draftBlocks.paragraphs;
  const draftHeadings = draftBlocks.headings;

  let structuralWarnings: string[] = [];
  let headingSimTotal = 0;

  for (const source of sources) {
    const sourceParagraphs = source.paragraphFunctions || [];
    const sourceHeadings = source.headingSequence || (source as any).structuralFlow || [];

    // Heading Sequence Check
    if (sourceHeadings.length > 0 && draftHeadings.length > 0) {
      let matchedHeadings = 0;
      for (const h1 of draftHeadings) {
          for (const h2 of sourceHeadings) {
              if (normalizePunctuation(h1) === normalizePunctuation(h2) && h1.length > 10) {
                  matchedHeadings++;
              }
          }
      }
      headingSimTotal = Math.max(headingSimTotal, (matchedHeadings / Math.max(draftHeadings.length, sourceHeadings.length)) * 100);
      if (headingSimTotal > 50) {
        structuralWarnings.push("Heading sequence heavily mirrors source material.");
      }
    }

    for (const draftP of draftParagraphs) {
      if (draftP.length < 30) continue; 
      
      const draftNorm = normalizePunctuation(draftP);
      let isQuoteOnly = extractQuotations(draftP).join(" ").length > draftP.length * 0.7; // Exclude if mostly quotation

      for (const sourceP of sourceParagraphs) {
        if (sourceP.length < 30 || isQuoteOnly) continue;
        const sourceNorm = normalizePunctuation(sourceP);

        // Exact & Punctuation-Normalized Match
        if (draftNorm === sourceNorm) {
            passed = false;
            failingPassages.push({
                sourceId: source.sourceId,
                paragraphText: draftP,
                similarityType: "EXACT_COPY",
                similarityScore: 100
            });
            repairInstructions.push(`Rewrite exact copied passage: "${draftP.substring(0, 30)}..."`);
            overallOriginalityScore = Math.min(overallOriginalityScore, 20);
            continue;
        }

        // Close Paraphrase Match
        const sim = jaccardSimilarity(draftP, sourceP);
        if (sim > 0.4) {
            passed = false;
            failingPassages.push({
                sourceId: source.sourceId,
                paragraphText: draftP,
                similarityType: "CLOSE_PARAPHRASE",
                similarityScore: sim * 100
            });
            repairInstructions.push(`Heavily rewrite close paraphrase: "${draftP.substring(0, 30)}..."`);
            overallOriginalityScore = Math.min(overallOriginalityScore, 60);
        }
        
        // Distinctive phrase reuse
        const draftPhrases = getPhrases(draftNorm);
        const sourcePhrases = getPhrases(sourceNorm);
        for (let p of draftPhrases) {
            if (sourcePhrases.includes(p)) {
                passed = false;
                failingPassages.push({
                    sourceId: source.sourceId,
                    paragraphText: draftP,
                    similarityType: "DISTINCTIVE_PHRASE_REUSE",
                    similarityScore: 80
                });
                repairInstructions.push(`Remove or rewrite distinctive phrase: "${p}"`);
                overallOriginalityScore = Math.min(overallOriginalityScore, 70);
            }
        }
      }
    }
  }
  
  if (headingSimTotal > 70) {
      passed = false;
      overallOriginalityScore = Math.min(overallOriginalityScore, 50);
      repairInstructions.push("Restructure article headings to differ from source.");
  }

  return {
    articleTraceId,
    passed,
    overallOriginalityScore,
    lexicalSimilarityScore: 100 - overallOriginalityScore,
    semanticSimilarityScore: 100 - overallOriginalityScore,
    headingStructureSimilarity: headingSimTotal,
    sectionSequenceSimilarity: headingSimTotal,
    highestRiskSourceId: failingPassages.length > 0 ? failingPassages[0].sourceId : "none",
    failingPassages,
    structuralWarnings,
    repairInstructions
  };
}

function getPhrases(text: string): string[] {
    const words = text.split(/\s+/).filter(w => !EXCLUSION_WORDS.has(w) && !COMMON_NICHE_TERMS.has(w));
    const phrases = [];
    for (let i = 0; i < words.length - 3; i++) {
        phrases.push(words.slice(i, i + 4).join(" "));
    }
    return phrases;
}
