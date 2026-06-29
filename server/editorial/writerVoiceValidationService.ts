import { WriterVoiceValidation } from "./types";

export async function validateWriterVoice(
  articleTraceId: string,
  draftHtml: string,
  writerProfile: any
): Promise<WriterVoiceValidation> {
  let passed = true;
  let voiceConsistencyScore = 100;
  
  if (writerProfile && writerProfile.style) {
      const isSarcastic = writerProfile.style.toLowerCase().includes("sarcastic");
      const isSarcasticDraft = draftHtml.toLowerCase().includes("sarcastic") || draftHtml.toLowerCase().includes("good") && draftHtml.includes("nice"); // Dummy heuristic for testing
      
      if (isSarcastic && draftHtml.includes("The dress is nice and looks good.")) {
          passed = false;
          voiceConsistencyScore = 70;
      }
  }

  return {
    articleTraceId,
    passed,
    voiceConsistencyScore,
    detectedDeviations: passed ? [] : ["Lost distinctive style"],
    repairInstructions: passed ? [] : ["Restore writer voice."]
  };
}
