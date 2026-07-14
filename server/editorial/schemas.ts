import { z } from "zod";

export const EditorialBriefSchema = z.object({
  articleId: z.string(),
  articleTraceId: z.string(),
  topic: z.string(),
  niche: z.string(),
  articleType: z.string(),
  targetAudience: z.string(),
  readerIntent: z.string().min(1, "readerIntent is required"),
  originalAngle: z.string().min(1, "originalAngle is required"),
  whyThisArticleShouldExist: z.string(),
  whyItMattersNow: z.string(),
  competitorCoverage: z.array(z.string()),
  newValueAdded: z.array(z.string()),
  confirmedFacts: z.array(z.string()),
  unverifiedClaims: z.array(z.string()),
  conflictingClaims: z.array(z.string()),
  prohibitedClaims: z.array(z.string()),
  requiredSources: z.array(z.string()),
  readerTakeaways: z.array(z.string()),
  recommendedStructure: z.array(z.string()).min(1, "recommendedStructure must not be empty"),
  tone: z.string(),
  voiceProfileId: z.string().min(1, "voiceProfileId is required"),
  targetLength: z.number(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  entities: z.array(z.string()),
  requiredQuestions: z.array(z.string()),
  riskFlags: z.array(z.string()),
  disclosureRequirements: z.array(z.string()),
  createdAt: z.string(),
  version: z.number()
}).refine(data => {
  if (data.articleType === "factual" && data.confirmedFacts.length === 0) {
    return false;
  }
  return true;
}, {
  message: "factual articles must contain at least one confirmedFact"
});

export const EvidenceLedgerEntrySchema = z.object({
  claimId: z.string(),
  articleId: z.string(),
  articleTraceId: z.string(),
  claimText: z.string(),
  sourceUrl: z.string(),
  sourceTitle: z.string(),
  publisher: z.string(),
  sourceDate: z.string(),
  accessedAt: z.string(),
  sourceType: z.string(),
  isPrimarySource: z.boolean(),
  confidence: z.number(),
  freshnessStatus: z.enum(["current", "recently_verified", "potentially_stale", "expired", "unverifiable"]),
  verificationStatus: z.enum(["verified", "partially_verified", "disputed", "unverified", "rejected"]),
  supportsClaim: z.boolean(),
  contradictsClaim: z.boolean(),
  riskLevel: z.string(),
  addedByAgent: z.string(),
  notes: z.string(),
  claimCategory: z.string().optional(),
  isTimeSensitive: z.boolean().optional(),
  isPublishCritical: z.boolean().optional(),
  validUntil: z.string().nullable().optional(),
  verificationMethod: z.string().optional(),
  sourceCount: z.number().optional()
}).refine(data => {
  if (data.verificationStatus === "verified" && !data.sourceUrl) {
     return false;
  }
  return true;
}, {
  message: "sourceUrl is required for verified claims",
  path: ["sourceUrl"]
});

export const EvidenceLedgerSchema = z.array(EvidenceLedgerEntrySchema);

export const ResearchBriefSchema = z.object({
  topic: z.string(),
  readerIntent: z.string(),
  whyItMattersNow: z.string(),
  verifiedFacts: z.array(z.string()),
  unverifiedClaims: z.array(z.string()),
  conflictingClaims: z.array(z.string()),
  freshnessWarnings: z.array(z.string()),
  recommendedAngles: z.array(z.string()),
  readerQuestions: z.array(z.string()),
  riskFlags: z.array(z.string())
});

export const SourceRecordSchema = z.object({
  url: z.string(),
  title: z.string(),
  publisher: z.string()
});

export const ResearchOutputSchema = z.object({
  articleTraceId: z.string(),
  researchBrief: ResearchBriefSchema,
  sources: z.array(SourceRecordSchema),
  evidenceLedger: z.array(EvidenceLedgerEntrySchema).optional() // We can generate this from ResearchAgent but allow it to be supplemented
});

export const WriterAssignmentSchema = z.object({
  selectedWriterId: z.string(),
  selectedWriterName: z.string(),
  selectionReason: z.string(),
  confidence: z.number(),
  alternativeWriters: z.array(z.string()),
  manualOverrideAllowed: z.boolean(),
  automaticSelectionUsed: z.boolean()
});

export const HumanWriterNoteSchema = z.object({
  noteId: z.string(),
  writerId: z.string(),
  articleId: z.string(),
  articleTraceId: z.string(),
  date: z.string(),
  location: z.string(),
  originalNote: z.string(),
  verificationStatus: z.string(),
  provenance: z.string()
});

export const DraftingOutputSchema = z.object({
  articleTraceId: z.string(),
  title: z.string(),
  articleHtml: z.string(),
  contentFormat: z.string().optional(),
  structureManifest: z.array(z.string()).optional(),
  claimsUsed: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  researchRequests: z.array(z.string())
});

export const NaturalStyleEditorOutputSchema = z.object({
  articleTraceId: z.string(),
  editedArticleHtml: z.string(),
  preservedClaimIds: z.array(z.string()),
  newPotentialClaimsDetected: z.array(z.string()),
  changesSummary: z.array(z.string())
});

export const FabricatedExperienceResultSchema = z.object({
  passed: z.boolean(),
  severity: z.string(),
  publishBlocked: z.boolean(),
  reason: z.string().optional(),
  passages: z.array(z.string()).optional(),
  matchedPatterns: z.array(z.string()).optional(),
  supportedByWriterNote: z.boolean().optional()
});

export const PipelineStateEnum = z.enum([
  "DISCOVERED",
  "RESEARCHING",
  "RESEARCH_FAILED",
  "RESEARCHED",
  "BRIEF_BUILDING",
  "BRIEF_INVALID",
  "PLAN_INVALID",
  "BRIEF_READY",
  "DRAFTING",
  "DRAFT_FAILED",
  "DRAFTED",
  "NATURAL_EDITING",
  "NATURAL_EDIT_FAILED",
  "NATURAL_EDITED",
  "VALIDATING",
  "VALIDATION_FAILED",
  "NEEDS_RESEARCH",
  "NEEDS_MANUAL_REVIEW",
  "APPROVED_FOR_MEDIA",
  "APPROVED_FOR_PUBLISHING",
  "PUBLISHED",
  "PUBLISH_FAILED"
]);


export const SourceDeconstructionSchema = z.object({
  sourceId: z.string(),
  articleTraceId: z.string(),
  sourceUrl: z.string(),
  publisher: z.string(),
  author: z.string(),
  publicationDate: z.string(),
  title: z.string(),
  headingSequence: z.array(z.string()),
  paragraphFunctions: z.array(z.string()),
  claimSequence: z.array(z.string()),
  exampleSequence: z.array(z.string()),
  quotationSequence: z.array(z.string()),
  namedEntities: z.array(z.string()),
  openingPattern: z.string(),
  closingPattern: z.string(),
  narrativePattern: z.string(),
  editorialAngle: z.string(),
  targetAudience: z.string(),
  valueProposition: z.string(),
  distinctivePhrases: z.array(z.string()),
  wordCount: z.number()
});

export const OriginalArticlePlanSchema = z.object({
  articleTraceId: z.string(),
  selectedPlaybookId: z.string(),
  originalAngle: z.string(),
  uniqueValueStatement: z.string(),
  readerJourney: z.array(z.string()),
  plannedSections: z.array(z.string()),
  sectionPurposes: z.array(z.string()),
  questionsAnswered: z.array(z.string()),
  practicalElements: z.array(z.string()),
  sourceCoverageMap: z.array(z.string()),
  requiredDifferentiators: z.array(z.string()),
  prohibitedSourcePatterns: z.array(z.string()),
  prohibitedPhrases: z.array(z.string()),
  competitorDifferences: z.array(z.string())
});

export const NichePlaybookSchema = z.object({
  playbookId: z.string(),
  requiredElements: z.array(z.string()),
  optionalElements: z.array(z.string()),
  prohibitedClaims: z.array(z.string()),
  requiredSourceTypes: z.array(z.string()),
  criticalClaimCategories: z.array(z.string()),
  requiredDisclosures: z.array(z.string()).optional(),
  usefulReaderElements: z.array(z.string()).optional(),
  toneBoundaries: z.array(z.string()).optional(),
  complianceRules: z.array(z.string()).optional(),
  scoringRequirements: z.any().optional()
});

export const OriginalityAnalysisSchema = z.object({
  articleTraceId: z.string(),
  passed: z.boolean(),
  overallOriginalityScore: z.number(),
  lexicalSimilarityScore: z.number(),
  semanticSimilarityScore: z.number(),
  headingStructureSimilarity: z.number(),
  sectionSequenceSimilarity: z.number(),
  highestRiskSourceId: z.string(),
  failingPassages: z.array(z.object({
    draftPassage: z.string(),
    sourceId: z.string(),
    sourcePassage: z.string(),
    similarityType: z.string(),
    similarityScore: z.number(),
    startOffset: z.number(),
    endOffset: z.number(),
    repairRequired: z.boolean()
  })),
  structuralWarnings: z.array(z.string()),
  repairInstructions: z.array(z.string())
});

export const NaturalnessAnalysisSchema = z.object({
  articleTraceId: z.string(),
  passed: z.boolean(),
  naturalnessScore: z.number(),
  rhythmScore: z.number(),
  voiceConsistencyScore: z.number(),
  specificityScore: z.number(),
  repetitionScore: z.number(),
  failingPassages: z.array(z.string()),
  detectedPatterns: z.array(z.string()),
  repairInstructions: z.array(z.string())
});

export const WriterVoiceValidationSchema = z.object({
  writerId: z.string(),
  passed: z.boolean(),
  voiceConsistencyScore: z.number(),
  matchedTraits: z.array(z.string()),
  lostTraits: z.array(z.string()),
  genericVoicePatterns: z.array(z.string()),
  repairInstructions: z.array(z.string())
});

export const EditorialRepairRecordSchema = z.object({
  repairId: z.string(),
  articleTraceId: z.string(),
  cycle: z.number(),
  failureType: z.string(),
  responsibleAgent: z.string(),
  failingPassages: z.array(z.string()),
  instructions: z.array(z.string()),
  protectedClaimIds: z.array(z.string()),
  beforeVersionId: z.string(),
  afterVersionId: z.string(),
  resolved: z.boolean(),
  createdAt: z.string()
});

export const ArticleVersionSchema = z.object({
  versionId: z.string(),
  articleTraceId: z.string(),
  versionType: z.string(),
  content: z.string(),
  createdByAgent: z.string(),
  requestedModel: z.string(),
  actualModel: z.string(),
  createdAt: z.string(),
  parentVersionId: z.string(),
  claimsUsed: z.array(z.string()),
  qualitySnapshot: z.any()
});

export const EditorialQualityScoreSchema = z.object({
  articleTraceId: z.string(),
  totalScore: z.number(),
  passed: z.boolean(),
  dimensions: z.any(),
  blockingFailures: z.array(z.string()),
  repairRecommendations: z.array(z.string())
});
