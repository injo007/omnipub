/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { writeStructuredLog } from "./observabilityService";

export interface FeatureFlags {
  enableRssIngestion: boolean;
  enableAiRewriting: boolean;
  enableImageGeneration: boolean;
  enablePhaseCRepair: boolean;
  enablePhaseDPackaging: boolean;
  enablePublishingJobCreation: boolean;
  enableImmediatePublishing: boolean;
  enableScheduledPublishing: boolean;
  enableWorkerExecution: boolean;
  enableWordPressUpdates: boolean;
  enableAutomaticReconciliation: boolean;
  enableModelFallback: boolean;
}

export interface KillSwitches {
  disableAllPublishing: boolean;
  disabledWordPressSites: string[]; // site IDs
  disabledProviders: string[]; // "openai", "gemini", etc.
  disabledWorkerVersions: string[];
  revokedCredentials: string[]; // key / credential identifiers
  problematicArticles: string[]; // article IDs
  problematicPackages: string[]; // package IDs
}

export interface GovernanceLimits {
  articlesPerHour: number;
  publishingJobsPerSitePerMinute: number;
  maxSimultaneousWorkerLeases: number;
  maxRetriesPerJob: number;
  maxReconciliationAttempts: number;
  maxDailyAICostUsd: number;
  maxMonthlyAICostUsd: number;
  maxImageCostUsd: number;
  maxQueueSize: number;
}

export interface CostControls {
  costPerArticleLimitUsd: number;
  monthlyBudgetUsd: number;
  warningThresholdPercentage: number; // e.g., 80 for 80%
  hardStopThresholdUsd: number;
  operatorOverrides: Array<{
    timestamp: string;
    operatorId: string;
    reason: string;
    targetLimit: string;
  }>;
}

// -------------------------------------------------------------
// In-Memory Governance State (Default Baseline Values)
// -------------------------------------------------------------
export let activeFeatureFlags: FeatureFlags = {
  enableRssIngestion: true,
  enableAiRewriting: true,
  enableImageGeneration: true,
  enablePhaseCRepair: true,
  enablePhaseDPackaging: true,
  enablePublishingJobCreation: true,
  enableImmediatePublishing: true,
  enableScheduledPublishing: true,
  enableWorkerExecution: true,
  enableWordPressUpdates: true,
  enableAutomaticReconciliation: true,
  enableModelFallback: true
};

export let activeKillSwitches: KillSwitches = {
  disableAllPublishing: false,
  disabledWordPressSites: [],
  disabledProviders: [],
  disabledWorkerVersions: [],
  revokedCredentials: [],
  problematicArticles: [],
  problematicPackages: []
};

export let activeGovernanceLimits: GovernanceLimits = {
  articlesPerHour: 50,
  publishingJobsPerSitePerMinute: 2,
  maxSimultaneousWorkerLeases: 10,
  maxRetriesPerJob: 5,
  maxReconciliationAttempts: 3,
  maxDailyAICostUsd: 5.00,
  maxMonthlyAICostUsd: 15.00,
  maxImageCostUsd: 0.10,
  maxQueueSize: 1000
};

export let activeCostControls: CostControls = {
  costPerArticleLimitUsd: 0.15, // standard 15 cents threshold
  monthlyBudgetUsd: 15.00,
  warningThresholdPercentage: 80, // 80% warning
  hardStopThresholdUsd: 15.00,
  operatorOverrides: []
};

// -------------------------------------------------------------
// Getters & Setters
// -------------------------------------------------------------
export function updateFeatureFlags(flags: Partial<FeatureFlags>): void {
  activeFeatureFlags = { ...activeFeatureFlags, ...flags };
  writeStructuredLog("INFO", "Feature Flags updated", { activeFeatureFlags });
}

export function updateKillSwitches(switches: Partial<KillSwitches>): void {
  activeKillSwitches = { ...activeKillSwitches, ...switches };
  writeStructuredLog("WARN", "Kill Switches updated", { activeKillSwitches });
}

export function updateGovernanceLimits(limits: Partial<GovernanceLimits>): void {
  activeGovernanceLimits = { ...activeGovernanceLimits, ...limits };
  writeStructuredLog("INFO", "Governance limits updated", { activeGovernanceLimits });
}

export function updateCostControls(controls: Partial<CostControls>): void {
  activeCostControls = { ...activeCostControls, ...controls };
  writeStructuredLog("INFO", "Cost controls updated", { activeCostControls });
}

// -------------------------------------------------------------
// Validation & Gatekeeper Helpers
// -------------------------------------------------------------
export function checkFeatureFlag(flagName: keyof FeatureFlags): boolean {
  return activeFeatureFlags[flagName] === true;
}

export function isSiteKilled(siteId: string): boolean {
  if (activeKillSwitches.disableAllPublishing) return true;
  return activeKillSwitches.disabledWordPressSites.includes(siteId);
}

export function isProviderKilled(provider: string): boolean {
  return activeKillSwitches.disabledProviders.includes(provider.toLowerCase());
}

export function isArticleOrPackageKilled(articleId: string, packageId?: string): boolean {
  if (activeKillSwitches.problematicArticles.includes(articleId)) return true;
  if (packageId && activeKillSwitches.problematicPackages.includes(packageId)) return true;
  return false;
}

export function registerOperatorOverride(operatorId: string, limitName: string, reason: string): void {
  activeCostControls.operatorOverrides.push({
    timestamp: new Date().toISOString(),
    operatorId,
    reason,
    targetLimit: limitName
  });
  writeStructuredLog("CRITICAL", `Operator security override registered by '${operatorId}' for limit '${limitName}'`, {
    operatorId,
    limitName,
    reason
  });
}

/**
 * Validates budget allocation before executing expensive workflows.
 * Returns { allowed: boolean, warning: boolean, message: string }
 */
export function validateCostBudget(currentMonthSpend: number, estimatedRunCost: number): {
  allowed: boolean;
  warning: boolean;
  message: string;
} {
  const projectedTotal = currentMonthSpend + estimatedRunCost;
  const hardStop = activeCostControls.hardStopThresholdUsd;
  const warningValue = (activeCostControls.monthlyBudgetUsd * activeCostControls.warningThresholdPercentage) / 100;

  if (projectedTotal >= hardStop) {
    return {
      allowed: false,
      warning: false,
      message: `Hard stop threshold of $${hardStop.toFixed(2)} USD reached or exceeded. Cost budget allocation denied.`
    };
  }

  if (projectedTotal >= warningValue) {
    return {
      allowed: true,
      warning: true,
      message: `Cost safety warning: Current total monthly spend projected to exceed warning threshold value of $${warningValue.toFixed(2)} USD.`
    };
  }

  return {
    allowed: true,
    warning: false,
    message: "Budget verified: Allocation permitted."
  };
}
