/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogSeverity = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface LogContext {
  environment?: string;
  service?: string;
  component?: string;
  requestId?: string;
  workflowRunId?: string;
  articleId?: string;
  packageId?: string;
  publishingJobId?: string;
  targetSiteId?: string;
  eventType?: string;
  reasonCode?: string;
  duration?: number;
  errorClass?: string;
  [key: string]: any;
}

// 1. Structured Logging with Recursive Redaction
export function redactSecrets(obj: any, seen = new WeakSet()): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") {
    // If it is a string, check if it matches secret pattern
    if (typeof obj === "string") {
      const lower = obj.toLowerCase();
      // Simple checks for raw keys/passwords
      if (
        (lower.includes("bearer ") && obj.length > 10) ||
        (lower.includes("key=") && obj.length > 10) ||
        /^[a-zA-Z0-9_\-]{30,100}$/.test(obj) // likely token or key
      ) {
        return "[REDACTED_SECRET]";
      }
    }
    return obj;
  }

  // Circular reference protection
  if (seen.has(obj)) {
    return "[CIRCULAR]";
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item, seen));
  }

  const redacted: Record<string, any> = {};
  const sensitiveKeys = [
    "credential",
    "password",
    "apikey",
    "api_key",
    "secret",
    "token",
    "cookie",
    "authorization",
    "prompt",
    "source",
    "content",
    "body",
    "html",
    "apppassword",
    "appPassword",
    "private_data"
  ];

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some((sk) => keyLower.includes(sk))) {
      redacted[key] = "[REDACTED_SENSITIVE_FIELD]";
    } else {
      redacted[key] = redactSecrets(value, seen);
    }
  }

  return redacted;
}

export const serverLogs: any[] = [];
const MAX_SERVER_LOGS = 1000;

export function pushToLogBuffer(log: any) {
  serverLogs.push(log);
  if (serverLogs.length > MAX_SERVER_LOGS) {
    serverLogs.shift();
  }
}

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

export function writeStructuredLog(
  severity: LogSeverity,
  message: string,
  context: LogContext = {}
): void {
  const env = process.env.NODE_ENV || "local";
  const service = "editorial-intelligence-platform";
  const timestamp = new Date().toISOString();

  const baseContext: LogContext = {
    environment: env,
    service,
    ...context
  };

  const redactedContext = redactSecrets(baseContext);

  const logPayload = {
    timestamp,
    severity,
    message,
    ...redactedContext
  };

  // Structured console log
  console.log(JSON.stringify(logPayload));
}

// Intercept other console logging calls to store them in the buffer
console.log = (...args: any[]) => {
  originalConsoleLog(...args);
  try {
    const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
    if (msg.trim().startsWith("{") && msg.trim().endsWith("}")) {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.timestamp && parsed.severity && parsed.message) {
          pushToLogBuffer(parsed);
          return;
        }
      } catch (e) {}
    }
    pushToLogBuffer({
      timestamp: new Date().toISOString(),
      severity: "INFO",
      message: msg,
      environment: process.env.NODE_ENV || "local",
      service: "editorial-intelligence-platform"
    });
  } catch (e) {}
};

console.warn = (...args: any[]) => {
  originalConsoleWarn(...args);
  try {
    const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
    pushToLogBuffer({
      timestamp: new Date().toISOString(),
      severity: "WARN",
      message: msg,
      environment: process.env.NODE_ENV || "local",
      service: "editorial-intelligence-platform"
    });
  } catch (e) {}
};

console.error = (...args: any[]) => {
  originalConsoleError(...args);
  try {
    const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
    pushToLogBuffer({
      timestamp: new Date().toISOString(),
      severity: "ERROR",
      message: msg,
      environment: process.env.NODE_ENV || "local",
      service: "editorial-intelligence-platform"
    });
  } catch (e) {}
};

// 2. Metrics Accumulation & Guarding Against High Cardinality
export interface AlertConfig {
  severity: "WARN" | "CRITICAL";
  trigger: string;
  evaluationWindow: string;
  recommendedAction: string;
  escalationTarget: string;
  runbookLink: string;
}

export const ALERT_RUNBOOKS: Record<string, AlertConfig> = {
  DEAD_LETTER_GROWTH: {
    severity: "CRITICAL",
    trigger: "dead_letter_jobs > 0",
    evaluationWindow: "5m",
    recommendedAction: "Inspect the dead-letter-queue collection in Firestore, check target site credentials and connection error details.",
    escalationTarget: "Head SaaS Engineer",
    runbookLink: "/docs/runbooks/DEAD_LETTER_recovery.md"
  },
  RECONCILIATION_BACKLOG: {
    severity: "WARN",
    trigger: "jobs_requiring_reconciliation > 5",
    evaluationWindow: "10m",
    recommendedAction: "Check worker loops, sync remote WordPress endpoint states, verify internet gateway connectivity.",
    escalationTarget: "Publishing Operator Team",
    runbookLink: "/docs/runbooks/RECONCILIATION_REQUIRED_handling.md"
  },
  WORDPRESS_AUTHENTICATION_FAILURES: {
    severity: "CRITICAL",
    trigger: "repeated auth failures",
    evaluationWindow: "1m",
    recommendedAction: "Revoke and rotate WordPress application passwords. Trigger emergency site lock if credentials breached.",
    escalationTarget: "Security Response Team",
    runbookLink: "/docs/runbooks/WordPress_auth_failure.md"
  },
  BUDGET_LIMIT_APPROACH: {
    severity: "WARN",
    trigger: "cost >= 80% monthly budget",
    evaluationWindow: "hourly",
    recommendedAction: "Switch work pipelines to CHEAP tier, notify finance, review model routing optimizations.",
    escalationTarget: "Administrator",
    runbookLink: "/docs/runbooks/budget_exhaustion.md"
  },
  FIRESTORE_OUTAGE: {
    severity: "CRITICAL",
    trigger: "Sustained Firestore errors",
    evaluationWindow: "1m",
    recommendedAction: "Verify Google Cloud Status dashboard, trigger secondary read fallback paths.",
    escalationTarget: "SRE On-Call",
    runbookLink: "/docs/runbooks/Firestore_outage.md"
  }
};

class MetricsTracker {
  // Simple in-memory aggregate metrics database to avoid massive card-growth
  private pipelineMetrics = {
    articles_ingested: 0,
    duplicate_sources_rejected: 0,
    phase_c_pass: 0,
    phase_c_repair: 0,
    phase_c_block: 0,
    phase_d_approved: 0,
    phase_d_manual_review: 0
  };

  private publishingMetrics = {
    jobs_queued: 0,
    jobs_scheduled: 0,
    jobs_published: 0,
    jobs_updated: 0,
    jobs_retrying: 0,
    jobs_requiring_reconciliation: 0,
    dead_letter_jobs: 0,
    duplicate_posts_prevented: 0,
    total_wait_time_ms: 0,
    total_duration_ms: 0,
    total_retry_count: 0,
    lease_recovery_count: 0
  };

  private aiAndCostMetrics = {
    provider_calls: {} as Record<string, number>,
    token_usage_input: 0,
    token_usage_output: 0,
    estimated_cost_usd: 0,
    provider_failures: 0,
    fallback_usage: 0,
    budget_blocks: 0
  };

  private securityMetrics = {
    unauthorized_requests: 0,
    rate_limit_blocks: 0,
    invalid_schema_requests: 0,
    rejected_manual_resolutions: 0,
    firestore_rule_denials: 0
  };

  // Prevent High Cardinality - strip variable items
  private sanitizeLabel(label: string): string {
    if (!label) return "unknown";
    // Check if label contains high-cardinality items like url, timestamp, or uuid
    if (label.startsWith("http://") || label.startsWith("https://") || label.length > 50 || /^[a-fA-F0-9-]{36}$/.test(label)) {
      writeStructuredLog("WARN", "High-cardinality metric label suppressed & sanitized to keep databases clean", { label });
      return "[SANUTIZED_CARD]";
    }
    return label.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  }

  public incrementPipeline(metric: keyof typeof this.pipelineMetrics): void {
    this.pipelineMetrics[metric]++;
  }

  public incrementPublishing(metric: keyof typeof this.publishingMetrics, amount = 1): void {
    this.publishingMetrics[metric] += amount;
  }

  public addPublishingDuration(durationMs: number): void {
    this.publishingMetrics.total_duration_ms += durationMs;
  }

  public addPublishingWaitTime(waitMs: number): void {
    this.publishingMetrics.total_wait_time_ms += waitMs;
  }

  public recordAICall(provider: string, model: string, tokensIn: number, tokensOut: number, cost: number): void {
    const providerKey = `${this.sanitizeLabel(provider)}:${this.sanitizeLabel(model)}`;
    this.aiAndCostMetrics.provider_calls[providerKey] = (this.aiAndCostMetrics.provider_calls[providerKey] || 0) + 1;
    this.aiAndCostMetrics.token_usage_input += tokensIn;
    this.aiAndCostMetrics.token_usage_output += tokensOut;
    this.aiAndCostMetrics.estimated_cost_usd += cost;
  }

  public incrementAIFailures(): void {
    this.aiAndCostMetrics.provider_failures++;
  }

  public incrementFallback(): void {
    this.aiAndCostMetrics.fallback_usage++;
  }

  public incrementBudgetBlocks(): void {
    this.aiAndCostMetrics.budget_blocks++;
  }

  public incrementSecurity(metric: keyof typeof this.securityMetrics): void {
    this.securityMetrics[metric]++;
  }

  public getSnapshot(): any {
    return {
      pipeline: { ...this.pipelineMetrics },
      publishing: { ...this.publishingMetrics },
      aiAndCost: { ...this.aiAndCostMetrics },
      security: { ...this.securityMetrics }
    };
  }

  public clear(): void {
    this.pipelineMetrics = {
      articles_ingested: 0,
      duplicate_sources_rejected: 0,
      phase_c_pass: 0,
      phase_c_repair: 0,
      phase_c_block: 0,
      phase_d_approved: 0,
      phase_d_manual_review: 0
    };
    this.publishingMetrics = {
      jobs_queued: 0,
      jobs_scheduled: 0,
      jobs_published: 0,
      jobs_updated: 0,
      jobs_retrying: 0,
      jobs_requiring_reconciliation: 0,
      dead_letter_jobs: 0,
      duplicate_posts_prevented: 0,
      total_wait_time_ms: 0,
      total_duration_ms: 0,
      total_retry_count: 0,
      lease_recovery_count: 0
    };
    this.aiAndCostMetrics = {
      provider_calls: {},
      token_usage_input: 0,
      token_usage_output: 0,
      estimated_cost_usd: 0,
      provider_failures: 0,
      fallback_usage: 0,
      budget_blocks: 0
    };
    this.securityMetrics = {
      unauthorized_requests: 0,
      rate_limit_blocks: 0,
      invalid_schema_requests: 0,
      rejected_manual_resolutions: 0,
      firestore_rule_denials: 0
    };
  }
}

export const Metrics = new MetricsTracker();

// 3. Error Redaction & Tracking Abstraction
export interface SecureError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export function secureAndTrackError(error: any, stableCode = "INTERNAL_ERROR"): SecureError {
  let rawMessage = error instanceof Error ? error.message : String(error);
  
  // Clean up message from any credentials, secrets, prompt text leaks
  let cleanMessage = rawMessage
    .replace(/[a-zA-Z0-9_\-]{30,100}/g, "[SECRET_REDACTED]")
    .replace(/(Bearer|Bearer%20)[a-zA-Z0-9_\-\.]+/ig, "[AUTH_HEADER_REDACTED]");

  // Truncate overly long details/evidence
  if (cleanMessage.length > 500) {
    cleanMessage = cleanMessage.slice(0, 500) + "... [Truncated for Observability Safety]";
  }

  const secure: SecureError = {
    code: stableCode,
    message: cleanMessage
  };

  // Track error in log
  writeStructuredLog("ERROR", `Tracked Secure Error [${stableCode}]: ${cleanMessage}`, {
    errorClass: error?.constructor?.name || "GenericError"
  });

  return secure;
}
