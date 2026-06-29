export interface OriginalityAnalysis {
    articleTraceId: string;
    passed: boolean;
    overallOriginalityScore: number;
    lexicalSimilarityScore: number;
    semanticSimilarityScore: number;
    headingStructureSimilarity: number;
    sectionSequenceSimilarity: number;
    highestRiskSourceId: string;
    failingPassages: Array<{sourceId: string, paragraphText: string, similarityType: string, similarityScore: number}>;
    structuralWarnings: string[];
    repairInstructions: string[];
}

export interface NaturalnessAnalysis {
    articleTraceId: string;
    passed: boolean;
    naturalnessScore: number;
    rhythmScore: number;
    voiceConsistencyScore: number;
    specificityScore: number;
    repetitionScore: number;
    failingPassages: string[];
    detectedPatterns: string[];
    repairInstructions: string[];
    aiMarkersDetected: number;
}

export interface WriterVoiceValidation {
    articleTraceId: string;
    passed: boolean;
    voiceConsistencyScore: number;
    detectedDeviations: string[];
    repairInstructions: string[];
}

import { z } from "zod";
import {
  SourceDeconstructionSchema,
  EditorialQualityScoreSchema,
  EditorialBriefSchema,
  EvidenceLedgerEntrySchema,
  EvidenceLedgerSchema,
  ResearchOutputSchema,
  WriterAssignmentSchema,
  ArticleVersionSchema,
  FabricatedExperienceResultSchema,
  HumanWriterNoteSchema,
  OriginalArticlePlanSchema,
  NichePlaybookSchema,
} from "./schemas";

export type SourceDeconstruction = z.infer<typeof SourceDeconstructionSchema>;
export type EditorialQualityScore = z.infer<typeof EditorialQualityScoreSchema>;
export type EditorialBrief = z.infer<typeof EditorialBriefSchema>;
export type EvidenceLedgerEntry = z.infer<typeof EvidenceLedgerEntrySchema>;
export type EvidenceLedger = z.infer<typeof EvidenceLedgerSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
export type WriterAssignment = z.infer<typeof WriterAssignmentSchema>;
export type ArticleVersion = z.infer<typeof ArticleVersionSchema>;
export type FabricatedExperienceResult = z.infer<typeof FabricatedExperienceResultSchema>;
export type HumanWriterNote = z.infer<typeof HumanWriterNoteSchema>;
export type OriginalArticlePlan = z.infer<typeof OriginalArticlePlanSchema>;
export type NichePlaybook = z.infer<typeof NichePlaybookSchema>;

export type PipelineStateTransition = {
    from?: string;
    to?: string;
    previousState?: string;
    newState?: string;
    articleTraceId?: string;
    responsibleAgent?: string;
    modelUsed?: string;
    reason?: string;
    timestamp: string;
};

export type ArticlePipelineState = string;
