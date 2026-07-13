import { z } from "zod";
import * as crypto from "crypto";

// --- State Machine States ---
export const JobStatusEnum = z.enum([
  "QUEUED",
  "SCHEDULED",
  "LEASED",
  "EXECUTING",
  "VERIFYING_REMOTE",
  "RETRY_WAIT",
  "PUBLISHED",
  "UPDATED",
  "RECONCILIATION_REQUIRED",
  "MANUAL_INTERVENTION_REQUIRED",
  "DEAD_LETTER",
  "CANCELLED",
  "TECHNICAL_FAILURE",
  // Backward compatibility support for pre-existing records and UI badge colors
  "queued",
  "leased",
  "published",
  "failed",
  "dead_letter",
  "aborted"
]);

export type JobStatus = z.infer<typeof JobStatusEnum>;

// --- State Transition Rules ---
export function isValidTransition(current: string, next: string): boolean {
  const c = current.toUpperCase();
  const n = next.toUpperCase();
  
  if (c === n) return true; // Self-transitions are benign
  
  // Terminal states cannot transition to other states, unless re-queued by admin
  const terminalStates = ["PUBLISHED", "UPDATED", "CANCELLED"];
  if (terminalStates.includes(c) && !["QUEUED"].includes(n)) {
    return false;
  }
  
  const transitions: Record<string, string[]> = {
    QUEUED: ["LEASED", "EXECUTING", "CANCELLED", "TECHNICAL_FAILURE", "FAILED"],
    SCHEDULED: ["QUEUED", "CANCELLED", "TECHNICAL_FAILURE"],
    LEASED: ["EXECUTING", "VERIFYING_REMOTE", "PUBLISHED", "UPDATED", "RETRY_WAIT", "DEAD_LETTER", "RECONCILIATION_REQUIRED", "MANUAL_INTERVENTION_REQUIRED", "TECHNICAL_FAILURE", "FAILED", "QUEUED"],
    EXECUTING: ["VERIFYING_REMOTE", "PUBLISHED", "UPDATED", "RETRY_WAIT", "DEAD_LETTER", "RECONCILIATION_REQUIRED", "MANUAL_INTERVENTION_REQUIRED", "TECHNICAL_FAILURE", "FAILED"],
    VERIFYING_REMOTE: ["PUBLISHED", "UPDATED", "RECONCILIATION_REQUIRED", "MANUAL_INTERVENTION_REQUIRED", "TECHNICAL_FAILURE", "FAILED"],
    RETRY_WAIT: ["QUEUED", "CANCELLED"],
    PUBLISHED: ["QUEUED", "UPDATED"],
    UPDATED: ["QUEUED", "PUBLISHED"],
    RECONCILIATION_REQUIRED: ["PUBLISHED", "UPDATED", "MANUAL_INTERVENTION_REQUIRED", "TECHNICAL_FAILURE", "FAILED"],
    MANUAL_INTERVENTION_REQUIRED: ["PUBLISHED", "UPDATED", "CANCELLED", "QUEUED"],
    DEAD_LETTER: ["QUEUED", "CANCELLED"],
    CANCELLED: ["QUEUED"],
    TECHNICAL_FAILURE: ["QUEUED", "CANCELLED", "MANUAL_INTERVENTION_REQUIRED"],
    FAILED: ["QUEUED", "CANCELLED", "DEAD_LETTER", "RETRY_WAIT"]
  };
  
  const allowed = transitions[c] || [];
  return allowed.includes(n);
}

// --- Deterministic Idempotency Key ---
export function calculateJobIdempotencyKey(params: {
  packageId: string;
  packageVersion: number;
  packageHash: string;
  targetSiteId: string;
  desiredAction: string;
  desiredStatus: string;
  scheduleTimestamp?: string | null;
}): string {
  const parts = [
    params.packageId,
    String(params.packageVersion),
    params.packageHash,
    params.targetSiteId,
    params.desiredAction,
    params.desiredStatus,
    params.scheduleTimestamp || "immediate"
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

// --- Runtime Schemas ---

export const AuditTransitionSchema = z.object({
  timestamp: z.string(),
  previousStatus: z.string(),
  newStatus: z.string(),
  action: z.string(),
  operatorId: z.string(),
  message: z.string()
});

export type AuditTransition = z.infer<typeof AuditTransitionSchema>;

export const PublishingJobSchema = z.object({
  jobId: z.string().min(1),
  packageId: z.string().min(1),
  targetSiteId: z.string().min(1),
  status: JobStatusEnum,
  leaseToken: z.string().nullable(),
  leaseOwnerId: z.string().nullable(),
  leaseAcquiredAt: z.string().nullable(),
  leaseExpiresAt: z.string().nullable(), // ISO String
  revision: z.number().default(0),
  runCount: z.number().min(0),
  maxRetries: z.number().min(0),
  nextRunAt: z.string(), // ISO String
  scheduledPublishAt: z.string().nullable(), // ISO String
  lastError: z.string().nullable(),
  wordpressPostId: z.union([z.string(), z.number()]).nullable(),
  destinationUrl: z.string().nullable(),
  trackingToken: z.string(),
  auditHistory: z.array(AuditTransitionSchema),
  articleTitle: z.string().optional(),
  priority: z.enum(["normal", "high"]).optional(),
  packageHash: z.string().optional()
});

export type PublishingJob = z.infer<typeof PublishingJobSchema>;

export const PublishingJobCreationSchema = z.object({
  articleId: z.string().min(1),
  siteId: z.string().min(1).optional(),
  scheduledPublishAt: z.string().datetime().nullable().optional()
});

export const WorkerExecutionRequestSchema = z.object({
  limit: z.number().min(1).max(50).optional()
});

export const RetryRequestSchema = z.object({
  jobId: z.string().min(1),
  operatorId: z.string().min(1).optional()
});

export const AbortRequestSchema = z.object({
  jobId: z.string().min(1),
  reason: z.string().min(1).max(1000),
  operatorId: z.string().min(1).optional()
});

export const ManualResolutionRequestSchema = z.object({
  jobId: z.string().min(1),
  wordpressPostId: z.union([z.string(), z.number()]),
  destinationUrl: z.string(),
  operatorId: z.string().min(1).optional()
});

export const ReconciliationRequestSchema = z.object({
  packageId: z.string().min(1),
  targetSiteId: z.string().min(1)
});

export const OperatorActionSchema = z.object({
  operatorId: z.string().min(1),
  role: z.enum(["admin", "operator", "editor"]),
  action: z.string().min(1),
  timestamp: z.string().datetime()
});

export const WordpressResponseSchema = z.object({
  id: z.number(),
  link: z.string(),
  title: z.any().optional(),
  content: z.any().optional(),
  slug: z.string().optional()
});

export const PublishingJobRecordSchema = PublishingJobSchema;

export const PublishingAuditEventSchema = z.object({
  articleId: z.string().min(1),
  workflowRunId: z.string().min(1),
  packageId: z.string().min(1),
  eventType: z.string().min(1),
  decision: z.string().optional(),
  action: z.string().min(1),
  sanitizedEvidence: z.string(),
  timestamp: z.string(),
  targetSiteId: z.string().min(1)
});
