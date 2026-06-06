/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NicheType = 'hollywood' | 'sports' | 'tech';

export interface NicheConfig {
  id: NicheType;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  themeStyle: 'glamour' | 'brutalist' | 'cyberpunk';
}

export interface Writer {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  niche: NicheType;
  voiceStyle: string; // e.g. "Sarcastic Glamour Insider"
  customPromptInstruction: string;
  targetInspiration: string; // Brand-safe voice profile inspiration (e.g., "Perez Hilton", "Bill Simmons", "Marques Brownlee")
  popularity: number; // 0-100 rating
  totalArticles: number;
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
  description: string;
  pubDate: string;
  niche: NicheType;
  sourceName: string;
  rating?: number;
  classification?: string;
  slotId?: string;
  slotName?: string;
  scheduledTime?: string;
  isHighestInSlot?: boolean;

  // SaaS 2.0 properties
  processingStatus?: string;
  opportunityScore?: number;
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
  status: 'running' | 'success' | 'failed';
  timestamp: string;
  output: string;
  changesMade?: string; // diff or description
  modelRequested?: string;
  modelActuallyUsed?: string;
  providerResolved?: string;
  fallbackHappened?: boolean;
  fallbackModelUsed?: string;
}

export interface WordPressConfig {
  url: string;
  username: string;
  appPassword: string; // WordPress Application Password
  isConfigured: boolean;
  autoPush: boolean; // Automatically push when draft reaches target compliance score
}

export interface ModelSettings {
  geminiApiKey: string;
  openaiApiKey: string;
  clarityApiKey: string; // Placeholder or another key if they want to integrate other networks
  researchModel: string;
  draftModel: string;
  humanizeModel: string;
  seoModel: string;
  imageModel: string;
  minHumanScoreTarget: number; // Target Editorial Naturalness Score constraint (e.g. 95)
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
  tags: string[];
  status: 'draft' | 'reviewing' | 'published';
  createdAt: string;

  // New Editorial Opportunity Fields
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
  };
  wordpressPush?: {
    postId?: number;
    postUrl?: string;
    status: 'idle' | 'pushing' | 'success' | 'failed';
    error?: string;
    pushedAt?: string;
  };
  workflowLogs: WorkflowStepLog[];
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
