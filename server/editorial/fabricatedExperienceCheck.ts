import { FabricatedExperienceResult, HumanWriterNote } from "./types";

const FABRICATED_PHRASES = [
  "i visited",
  "i stayed",
  "i tested",
  "i tried",
  "we visited",
  "we stayed",
  "we tested",
  "we tried",
  "on my trip",
  "on our trip",
  "when i arrived",
  "when we arrived",
  "our editors experienced",
  "our team tested"
];

export function checkFabricatedExperience(text: string, humanWriterNotes: HumanWriterNote[]): FabricatedExperienceResult {
  const originalPassages: string[] = [];
  const matchedPatterns: string[] = [];
  
  // Exclude direct quotations: simple approach removes content in double quotes. 
  // also exclude "if i visited", "if we visited", etc.
  let textToCheck = text.replace(/["“”][^"“”]*["“”]/g, ""); // Remove quotes
  
  // Remove "if" statements (e.g. "If I visited")
  textToCheck = textToCheck.replace(/if\s+(i|we)\s+(visited|stayed|tested|tried)/gi, "");
  
  // Check against phrases
  const lowerText = textToCheck.toLowerCase();
  for (const phrase of FABRICATED_PHRASES) {
    // make sure it's surrounded by word boundaries
    const regex = new RegExp(`\\b${phrase}\\b`, "i");
    const match = textToCheck.match(regex);
    if (match) {
       originalPassages.push(match[0]);
       matchedPatterns.push(phrase);
    }
  }

  if (matchedPatterns.length === 0) {
    return { passed: true, severity: "none", publishBlocked: false, matchedPatterns: [], supportedByWriterNote: false };
  }

  const hasVerifiedNote = humanWriterNotes.some(note => note.verificationStatus === "verified");

  if (hasVerifiedNote) {
     return { passed: true, severity: "none", publishBlocked: false, matchedPatterns, supportedByWriterNote: true };
  }

  return {
    passed: false,
    severity: "critical",
    publishBlocked: true,
    reason: "FABRICATED_FIRST_PERSON_EXPERIENCE",
    passages: originalPassages,
    matchedPatterns,
    supportedByWriterNote: false
  };
}
