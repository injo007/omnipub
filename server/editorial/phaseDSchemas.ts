import { z } from "zod";

export const PhaseDDecisionEnum = z.enum([
  "APPROVED_FOR_PUBLISHING",
  "SCHEDULED",
  "MANUAL_REVIEW_REQUIRED",
  "BLOCKED",
  "TECHNICAL_FAILURE"
]);

export const PhaseDInputContractSchema = z.object({
  articleId: z.string(),
  workflowRunId: z.string(),
  articleVersionId: z.string(),
  approvedTitle: z.string(),
  approvedBodyHtml: z.string(),
  approvedExcerpt: z.string().optional(),
  approvedHeadings: z.array(z.string()),
  approvedQuotations: z.array(z.string()).optional(),
  approvedAttributionText: z.string().optional(),
  approvedFactualClaimReferences: z.array(z.string()).optional(),
  nichePlaybookId: z.string(),
  editorialVoiceProfileId: z.string(),
  phaseCTerminalState: z.string(),
  phaseCQualityResult: z.any(),
  sourcePolicyResult: z.boolean(),
  verifiedSourceRecords: z.array(z.any()),
  citationRecords: z.array(z.any()),
  factualVerificationResult: z.boolean(),
  originalityResult: z.boolean(),
  naturalnessResult: z.boolean(),
  writerVoiceResult: z.boolean(),
  seoPlan: z.any().optional(),
  seoMetadata: z.any().optional(),
  mediaPackage: z.any().optional(),
  targetWordpressSiteId: z.string(),
  categoryMappings: z.array(z.string()),
  tagMappings: z.array(z.string()),
  authorMappingId: z.string(),
  schedulingRequest: z.any().optional(),
  disclosureRequirements: z.array(z.string()).optional(),
  legalNotices: z.array(z.string()).optional(),
  upstreamProvenance: z.any().optional(),
  upstreamCostSummary: z.any().optional(),
  timestamps: z.any().optional()
});

export const FinalArticlePackageSchema = z.object({
  packageId: z.string(),
  articleId: z.string(),
  workflowRunId: z.string(),
  packageVersion: z.number(),
  sourceArticleVersionId: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  packageStatus: PhaseDDecisionEnum,

  editorialContent: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    bodyHtml: z.string(),
    bodyTextHash: z.string(),
    headings: z.array(z.string()),
    nichePlaybookId: z.string(),
    editorialVoiceProfileId: z.string(),
    language: z.string(),
    wordCount: z.number(),
    readingTime: z.number()
  }),

  seo: z.object({
    primaryKeyword: z.string().optional(),
    secondaryKeywords: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().optional(),
    robotsDirectives: z.string().optional(),
    schemaType: z.string().optional(),
    structuredDataPayload: z.any().optional(),
    socialPreviewMetadata: z.any().optional()
  }),

  sourcesAndVerification: z.object({
    normalizedSourceReferences: z.array(z.any()),
    citations: z.array(z.any()),
    attributionRecords: z.array(z.any()),
    sourcePolicyDecision: z.boolean(),
    factualVerificationSnapshot: z.any(),
    originalitySnapshot: z.any(),
    naturalnessSnapshot: z.any(),
    voiceValidationSnapshot: z.any(),
    completePhaseCQualitySnapshot: z.any()
  }),

  media: z.object({
    featuredImageReference: z.string().optional(),
    imageSourceProvenance: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    attribution: z.string().optional(),
    dimensions: z.string().optional(),
    mimeType: z.string().optional(),
    mediaPolicyResult: z.boolean().optional(),
    optionalGalleryItems: z.array(z.any()).optional()
  }),

  publishingTarget: z.object({
    wordpressSiteId: z.string(),
    endpointReference: z.string(),
    mappedAuthorId: z.string(),
    mappedCategoryIds: z.array(z.string()),
    mappedTagIds: z.array(z.string()),
    desiredPostStatus: z.string(),
    desiredPublishTime: z.string().optional(),
    timezone: z.string().optional(),
    schedulingPolicy: z.string().optional(),
    permalinkPreview: z.string().optional()
  }),

  auditAndProvenance: z.object({
    upstreamProvidersAndModels: z.array(z.string()),
    repairAttemptCount: z.number(),
    sourceVersionHashes: z.record(z.string(), z.string()),
    finalPackageHash: z.string(),
    qualityConfigurationVersion: z.string(),
    promptConfigurationVersionReferences: z.array(z.string()),
    costSummary: z.any(),
    decisionEvents: z.array(z.any()),
    sanitizedFailureReasons: z.array(z.string())
  })
});

export const WordpressPayloadSchema = z.object({
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  slug: z.string().optional(),
  status: z.enum(["publish", "future", "draft", "pending", "private"]),
  date: z.string().optional(),
  author: z.number().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  featured_media: z.number().optional(),
  meta: z.record(z.string(), z.any()).optional()
});

export const PhaseDAuditEventSchema = z.object({
  articleId: z.string(),
  workflowRunId: z.string(),
  packageId: z.string().optional(),
  packageVersion: z.number().optional(),
  eventType: z.string(),
  decision: PhaseDDecisionEnum.optional(),
  checkId: z.string().optional(),
  action: z.string(),
  reasonCode: z.string().optional(),
  sanitizedEvidence: z.string().optional(),
  timestamp: z.string(),
  providerAndModel: z.string().optional(),
  targetSiteId: z.string().optional()
});
