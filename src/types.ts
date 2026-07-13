/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NicheType = string;

export interface NicheConfig {
  id: NicheType;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  themeStyle: 'glamour' | 'brutalist' | 'cyberpunk' | 'editorial' | string;
}

export interface Writer {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  niche: NicheType;
  voiceStyle: string; // e.g. "Sarcastic Glamour Insider"
  customPromptInstruction: string;
  targetInspiration: string; // Brand-safe voice profile inspiration (e.g., "Glossy Tabloid Anchor", "Team Culture Essayist", "Clean Aesthetic Reviewer")
  popularity: number; // 0-100 rating
  totalArticles: number;
  
  // Advanced Elite Writer properties (Phase 2C)
  displayName?: string;
  nicheFit?: string[];
  tone?: string;
  voiceDescription?: string;
  sentenceRhythm?: string;
  paragraphStyle?: string;
  humorLevel?: 'none' | 'light' | 'medium' | 'strong';
  opinionLevel?: 'neutral' | 'light' | 'moderate' | 'strong';
  formality?: 'casual' | 'balanced' | 'professional';
  allowedDevices?: string[];
  bannedDevices?: string[];
  exampleDo?: string[];
  exampleAvoid?: string[];
  contentStrengths?: string[];
  riskNotes?: string[];
  skills?: string[];
  competitor?: string;
}

export interface WriterProfile {
  id: string;
  name: string;
  displayName: string;
  nicheFit: string[];
  tone: string;
  voiceDescription: string;
  sentenceRhythm: string;
  paragraphStyle: string;
  humorLevel: 'none' | 'light' | 'medium' | 'strong';
  opinionLevel: 'neutral' | 'light' | 'moderate' | 'strong';
  formality: 'casual' | 'balanced' | 'professional';
  allowedDevices: string[];
  bannedDevices: string[];
  exampleDo: string[];
  exampleAvoid: string[];
  contentStrengths: string[];
  riskNotes: string[];
  skills?: string[];
  competitor?: string;
  voiceStyle?: string;
  bio?: string;
  customPromptInstruction?: string;
}

export interface EditorialPolicy {
  preserveFacts: boolean;
  adsenseSafe: boolean;
  avoidCliches: boolean;
  avoidClickbait: boolean;
  qualityScoreTarget: number;
}

export interface SeoPolicy {
  targetDensity: number;
  slugLowercase: boolean;
  metaDescLength: number;
  includeFaq: boolean;
}

export interface AdsensePolicy {
  monetizableOnly: boolean;
  noSensitiveDirectClaims: boolean;
  cleanVocabulary: boolean;
}

export interface EditorialContext {
  wordpressSiteId?: string;
  wordpressSiteName?: string;
  wordpressSiteUrl?: string;
  niche: string;
  subNiche?: string;
  rssSourceName?: string;
  rssSourceUrl?: string;
  sourceUrl?: string;
  sourceTitle: string;
  cleanSourceContent: string;
  sourceSummary?: string;
  storyType?: string;
  
  // Advanced Copilot Dials
  targetAudience?: string;
  copilotTone?: string;
  copilotStructure?: string;
  copilotSeoStrategy?: string;
  copilotContentObjectives?: string;
  copilotEngagementOptimization?: string;
  copilotAuthorityBuilding?: string;
  copilotConversionOptimization?: string;

  focusKeyword?: string;
  secondaryKeywords?: string[];
  selectedWriterProfile: WriterProfile;
  editorialPolicy: EditorialPolicy;
  seoPolicy: SeoPolicy;
  adsensePolicy: AdsensePolicy;

  // New Editorial Fields
  articleTraceId?: string;
  originalAngle?: string;
  writerProfile?: any;
  leadImage?: string;
  leadImageSource?: string;
  researchLedger?: any[];
  unresolvedQuestions?: string[];
  targetStructure?: string[];
  seoStrategy?: string;
}

export interface RssFeed {
  id: string;
  name: string;
  url: string;
  niche: NicheType;
  isActive: boolean;
  lastSyncedAt?: string;
}

export interface SuggestedSource {
  id: string;
  title: string;
  url: string;
  description?: string;
  pubDate?: string;
  niche?: NicheType;
  sourceName?: string;
  rating?: number;
  classification?: string;
  slotId?: string;
  slotName?: string;
  scheduledTime?: string;
  isHighestInSlot?: boolean;

  // SaaS 2.0 properties
  processingStatus?: string;
  opportunityScore?: number;
  riskScore?: number;
  pipeline?: string;
  manualReview?: boolean;
  scoreLabel?: string;
  scoreReasoning?: string;
  scores?: {
    trendScore: number;
    seoScore: number;
    contentQuality: number;
    audienceFit: number;
    mediaScore: number;
    monetization: number;
    riskScore: number;
  };
  keywordResearch?: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    longTailKeywords: string[];
    trendConfidence: number;
    seoOpportunity: number;
    competitionRisk: string;
    suggestedTitle: string;
    suggestedSlug: string;
    suggestedMetaDesc: string;
    suggestedCategory: string;
    recommendedAngle: string;
  };
  trendComparison?: {
    trendsMatch: string;
    trendsQuery: string;
    regionInterest: string;
    risingKeywords: string[];
  };
  factSafetyScore?: number;
  factClaims?: string[];
}

export interface WorkflowStepLog {
  step: 'research' | 'drafting' | 'editing' | 'validation' | 'seo' | 'image' | 'refinement';
  agentName: string;
  status: 'running' | 'success' | 'failed' | 'error' | 'warn' | 'interrupted';
  timestamp: string;
  output: string;
  changesMade?: string; // diff or description
  modelRequested?: string;
  modelActuallyUsed?: string;
  providerResolved?: string;
  fallbackHappened?: boolean;
  fallbackModelUsed?: string;
  runtimeClientUsed?: string;
  source?: 'agent-settings' | 'default' | 'fallback';
  fallbackEnabled?: boolean;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  attempt?: number;
  promptText?: string;
  systemPrompt?: string;
  userPrompt?: string;
  compiledPrompt?: string;
  variables?: any;
  tokensInput?: number;
  tokensOutput?: number;
  actualCost?: number;
}

export interface WordPressConfig {
  url: string;
  username: string;
  appPassword: string; // WordPress Application Password
  isConfigured: boolean;
  autoPush: boolean; // Automatically push when draft reaches target compliance score
}

export interface ModelSettings {
  /** Internal one-time defaults migration marker; explicit model choices are never overwritten. */
  modelRoutingSchemaVersion?: number;
  promptAuditEnabled?: boolean;
  geminiApiKey: string;
  openaiApiKey: string;
  openrouterApiKey?: string;
  minimaxApiKey?: string;
  clarityApiKey: string; // Placeholder or another key if they want to integrate other networks
  opportunityScoringModel?: string;
  opportunityScoringCustomModel?: string;
  opportunityScoringFallbackModel?: string;
  opportunityScoringFallbackCustomModel?: string;
  researchModel: string;
  researchCustomModel?: string;
  researchFallbackModel?: string;
  researchFallbackCustomModel?: string;
  draftModel: string;
  draftCustomModel?: string;
  draftFallbackModel?: string;
  draftFallbackCustomModel?: string;
  humanizeModel: string;
  humanizeCustomModel?: string;
  humanizeFallbackModel?: string;
  humanizeFallbackCustomModel?: string;
  seoModel: string;
  seoCustomModel?: string;
  seoFallbackModel?: string;
  seoFallbackCustomModel?: string;
  originalityModel?: string;
  originalityCustomModel?: string;
  originalityFallbackModel?: string;
  originalityFallbackCustomModel?: string;
  validationModel?: string;
  validationCustomModel?: string;
  validationFallbackModel?: string;
  validationFallbackCustomModel?: string;
  copilotSynthesisModel?: string;
  copilotSynthesisCustomModel?: string;
  copilotSynthesisFallbackModel?: string;
  copilotSynthesisFallbackCustomModel?: string;
  fallbackEnabled?: boolean;
  globalFallbackModel?: string;
  globalFallbackCustomModel?: string;
  imageModel: string;
  imageCustomModel?: string;
  imageFallbackModel?: string;
  imageFallbackCustomModel?: string;
  aiImagePreferred?: boolean;
  minHumanScoreTarget: number; // Target Editorial Naturalness Score constraint (e.g. 95)
  maxConcurrentAgents?: number;
  openrouterCustomModel?: string;
  discoveryModel?: string;
  discoveryCustomModel?: string;
  discoveryFallbackModel?: string;
  discoveryFallbackCustomModel?: string;
  nicheDiscoveryModel?: string;
  nicheDiscoveryCustomModel?: string;
  nicheDiscoveryFallbackModel?: string;
  nicheDiscoveryFallbackCustomModel?: string;
  pipelines?: any;
  budgetSettings?: any;
  inlineImageMode?: 'generate' | 'promptOnly' | 'none';
}

export interface SaaSConfig {
  modelSettings: ModelSettings;
  wordpress: Record<NicheType, WordPressConfig>;
}

export interface Article {
  id: string;
  niche: NicheType;
  sourceTitle: string;
  sourceLink: string;
  authorId: string;
  customAuthorName?: string; // Statically overrides registered writer name
  title: string;
  content: string; // Markdown formatted
  originalImageUrl?: string;
  imageUrl?: string; // Optional legacy alias
  tags: string[];
  status: 'draft' | 'reviewing' | 'published' | 'manual_review';
  createdAt: string;

  // New Editorial Opportunity Fields
  sourceId?: string;
  sourceDescription?: string;
  oppScore?: number;
  pipeline?: string;
  opportunityScore?: number;
  riskScore?: number;
  sourceReliabilityScore?: number;
  editorialQualityScore?: number;
  factSafetyScore?: number;
  originalityScore?: number;
  seoScore?: number;
  formattingScore?: number;
  imageSafetyScore?: number;
  pipelineType?: 'cheap' | 'balanced' | 'premium' | 'emergency';
  manualReviewRequired?: boolean;
  slug?: string;
  seoAuditReport?: any;
  
  stats: {
    views: number;
    shares: number;
    commentsCount: number;
  };
  seo: {
    title: string;
    description: string;
    focusKeyword?: string;
    keywords: string[];
    readabilityScore: number;
    uniquenessScore: number; // Original editorial
    humanScore: number; // Editorial Naturalness Score, e.g. 98%
    iterationsUsed?: number; // Amount of refinement runs triggered
    metaDescriptionOverride?: string;
    canonicalUrlOverride?: string;
    slug?: string;
    imageAlt?: string;
  };
  wordpressPush?: {
    postId?: number;
    postUrl?: string;
    status: 'idle' | 'pushing' | 'success' | 'failed';
    error?: string;
    pushedAt?: string;
    metaPermissionRequired?: boolean;
    warning?: string;
  };
  workflowLogs: WorkflowStepLog[];
  audioBriefing?: {
    textBrief: string;
    audioBase64: string;
    voiceName: string;
    createdAt: string;
  };
}

export interface GenerationTask {
  id: string;
  articleId?: string;
  niche: NicheType;
  sourceTitle: string;
  sourceUrl: string;
  writerId: string;
  currentStep: 'research' | 'drafting' | 'editing' | 'validation' | 'seo' | 'image' | 'completed' | 'failed';
  status: 'idle' | 'running' | 'success' | 'failed';
  logs: WorkflowStepLog[];
  createdAt: string;
}
