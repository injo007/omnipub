import { getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { 
  PublishingJob, 
  AuditTransition, 
  JobStatus,
  isValidTransition,
  calculateJobIdempotencyKey,
  WordpressResponseSchema,
  FirestoreAuditEventSchema
} from "./publishingQueueTypes";
import { FinalArticlePackage, PhaseDAuditEvent } from "./typesPhaseD";
import { buildWordpressPayload } from "./wordpressPayloadBuilder";

let pushToWpAdapter: (article: any, wpConfig: any) => Promise<any>;

export function setPushToWordPressAdapter(adapter: (article: any, wpConfig: any) => Promise<any>) {
  pushToWpAdapter = adapter;
}

// --- Failure Classification ---
export type FailureClass = 
  | "NETWORK_TRANSIENT"
  | "RATE_LIMITED"
  | "WORDPRESS_SERVER_ERROR"
  | "AUTHENTICATION_FAILURE"
  | "PERMISSION_FAILURE"
  | "INVALID_PAYLOAD"
  | "INVALID_MAPPING"
  | "PACKAGE_INVALID"
  | "PACKAGE_REVOKED"
  | "AMBIGUOUS_REMOTE_OUTCOME"
  | "FIRESTORE_TRANSIENT"
  | "FIRESTORE_FATAL"
  | "LEASE_LOST"
  | "UNKNOWN_TECHNICAL_FAILURE";

export function classifyFailure(error: any): { failureClass: FailureClass; isRetryable: boolean } {
  const msg = (error.message || String(error)).toLowerCase();
  const status = error.status || error.statusCode;

  if (status === 429) {
    return { failureClass: "RATE_LIMITED", isRetryable: true };
  }
  if (status === 401) {
    return { failureClass: "AUTHENTICATION_FAILURE", isRetryable: false };
  }
  if (status === 403) {
    return { failureClass: "PERMISSION_FAILURE", isRetryable: false };
  }
  if (status === 400) {
    return { failureClass: "INVALID_PAYLOAD", isRetryable: false };
  }
  if ([408, 425, 500, 502, 503, 504].includes(status)) {
    return { failureClass: "NETWORK_TRANSIENT", isRetryable: true };
  }

  if (msg.includes("unauthorized") || msg.includes("credentials") || msg.includes("invalid key") || msg.includes("auth")) {
    return { failureClass: "AUTHENTICATION_FAILURE", isRetryable: false };
  }
  if (msg.includes("forbidden") || msg.includes("permission denied") || msg.includes("not allowed")) {
    return { failureClass: "PERMISSION_FAILURE", isRetryable: false };
  }
  if (msg.includes("timeout") || msg.includes("socket") || msg.includes("econnreset") || msg.includes("dns") || msg.includes("fetch") || msg.includes("network")) {
    return { failureClass: "NETWORK_TRANSIENT", isRetryable: true };
  }
  if (msg.includes("revoked") || msg.includes("blocked") || msg.includes("superseded")) {
    return { failureClass: "PACKAGE_REVOKED", isRetryable: false };
  }
  if (msg.includes("invalid package") || msg.includes("mismatch")) {
    return { failureClass: "PACKAGE_INVALID", isRetryable: false };
  }
  if (msg.includes("lease")) {
    return { failureClass: "LEASE_LOST", isRetryable: false };
  }

  return { failureClass: "UNKNOWN_TECHNICAL_FAILURE", isRetryable: true };
}

export class PublishingQueueService {
  private get db() {
    if (!getApps().length) {
      throw new Error("Firebase Admin not initialized.");
    }
    return getFirestore();
  }

  /**
   * Helper to append an audit event to a job and create a PhaseDAuditEvent.
   * Central state transition check is enforced here.
   */
  private async appendAuditEvent(
    transaction: FirebaseFirestore.Transaction | null,
    jobDocRef: FirebaseFirestore.DocumentReference,
    job: PublishingJob,
    newStatus: JobStatus,
    action: string,
    message: string,
    operatorId: string = "system-worker"
  ): Promise<PublishingJob> {
    const previousStatus = job.status;

    // Enforce centralized state machine transition gating
    if (!isValidTransition(previousStatus, newStatus)) {
      throw new Error(`[STATE MACHINE EXCEPTION] Illegal job state transition from '${previousStatus}' to '${newStatus}' for Job ID: ${job.jobId}`);
    }

    const transition: AuditTransition = {
      timestamp: new Date().toISOString(),
      previousStatus,
      newStatus,
      action,
      operatorId,
      message: message.substring(0, 1000)
    };

    const nextRevision = (job.revision || 0) + 1;
    const updatedJob: PublishingJob = {
      ...job,
      status: newStatus,
      revision: nextRevision,
      auditHistory: [...(job.auditHistory || []), transition]
    };

    const rawAuditEvent = {
      articleId: job.packageId.replace("pkg_", ""),
      workflowRunId: "PHASE_E_QUEUE",
      packageId: job.packageId,
      eventType: "QUEUE_TRANSITION",
      action: `${action} (${previousStatus} -> ${newStatus})`,
      sanitizedEvidence: message,
      timestamp: new Date().toISOString(),
      targetSiteId: job.targetSiteId
    };

    // Safe parsing via schemas
    const auditEvent = FirestoreAuditEventSchema.parse(rawAuditEvent);

    if (transaction) {
      transaction.set(jobDocRef, updatedJob);
      const auditRef = this.db.collection("phase_d_audits").doc();
      transaction.set(auditRef, auditEvent);
    } else {
      await jobDocRef.set(updatedJob);
      await this.db.collection("phase_d_audits").add(auditEvent);
    }

    return updatedJob;
  }

  /**
   * Adds a package to the publishing queue.
   * Leverages deterministic hashing to achieve perfect client and server idempotency.
   */
  async addJob(packageId: string, scheduledPublishAt?: string | null): Promise<PublishingJob> {
    // 1. Fetch Final Article Package
    const pkgSnap = await this.db.collection("phase_d_packages").doc(packageId).get();
    if (!pkgSnap.exists) {
      throw new Error(`FinalArticlePackage with ID ${packageId} does not exist.`);
    }
    const pkg = pkgSnap.data() as FinalArticlePackage;

    const currentStatus = pkg.packageStatus || (pkg as any).decision;
    if (currentStatus !== "APPROVED_FOR_PUBLISHING" && currentStatus !== "SCHEDULED") {
      throw new Error(`Only packages with APPROVED_FOR_PUBLISHING or SCHEDULED decision are permitted to create a publishing job. Current decision: ${currentStatus}`);
    }

    // 2. Deterministic Idempotency Key Creation
    const deterministicId = calculateJobIdempotencyKey({
      packageId,
      packageVersion: pkg.packageVersion || 1,
      packageHash: pkg.editorialContent?.bodyTextHash || "nohash",
      targetSiteId: pkg.publishingTarget?.wordpressSiteId || "default",
      desiredAction: "publish",
      desiredStatus: scheduledPublishAt ? "SCHEDULED" : "QUEUED",
      scheduleTimestamp: scheduledPublishAt
    });

    const docRef = this.db.collection("publishing_queue").doc(deterministicId);

    // Run transaction to read and write atomically to prevent race-conditions
    const finalJob = await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists) {
        console.log(`[QUEUE] Job ${deterministicId} already exists. Returning duplicate.`);
        return snap.data() as PublishingJob;
      }

      const runAt = scheduledPublishAt || new Date().toISOString();
      const trackingToken = uuidv4();
      const initialStatus: JobStatus = scheduledPublishAt ? "SCHEDULED" : "QUEUED";

      const job: PublishingJob = {
        jobId: deterministicId,
        packageId,
        targetSiteId: pkg.publishingTarget?.wordpressSiteId || "default",
        status: initialStatus,
        leaseToken: null,
        leaseOwnerId: null,
        leaseAcquiredAt: null,
        leaseExpiresAt: null,
        revision: 0,
        runCount: 0,
        maxRetries: 3,
        nextRunAt: runAt,
        scheduledPublishAt: scheduledPublishAt || null,
        lastError: null,
        wordpressPostId: null,
        destinationUrl: null,
        trackingToken,
        auditHistory: [],
        articleTitle: pkg.editorialContent?.title || "Untitled Article"
      };

      // Append audit event and set document
      const previousStatus = "QUEUED"; // dummy for initial gate
      const transition: AuditTransition = {
        timestamp: new Date().toISOString(),
        previousStatus: "NONE",
        newStatus: initialStatus,
        action: "JOB_CREATED",
        operatorId: "system",
        message: `Job created with deterministic idempotency key for site ${job.targetSiteId}`
      };

      job.auditHistory.push(transition);
      transaction.set(docRef, job);

      const auditEvent: PhaseDAuditEvent = {
        articleId: packageId.replace("pkg_", ""),
        workflowRunId: "PHASE_E_QUEUE",
        packageId,
        eventType: "QUEUE_TRANSITION",
        action: `JOB_CREATED (NONE -> ${initialStatus})`,
        sanitizedEvidence: `Deterministic ID: ${deterministicId}`,
        timestamp: new Date().toISOString(),
        targetSiteId: job.targetSiteId
      };
      const auditRef = this.db.collection("phase_d_audits").doc();
      transaction.set(auditRef, auditEvent);

      return job;
    });

    return finalJob;
  }

  /**
   * Fetch and lease pending jobs for the worker using Firestore transactions
   */
  async leaseNextJobs(limit: number = 5, workerId: string = `worker_${uuidv4().substring(0, 8)}`): Promise<PublishingJob[]> {
    const nowStr = new Date().toISOString();
    const leasedJobs: PublishingJob[] = [];

    // Retrieve active candidate jobs
    const queuedSnap = await this.db.collection("publishing_queue").where("status", "in", ["queued", "QUEUED", "failed", "RETRY_WAIT", "leased", "LEASED", "EXECUTING"]).get();
    const candidateJobs: PublishingJob[] = [];
    queuedSnap.forEach(doc => candidateJobs.push(doc.data() as PublishingJob));

    // Handle scheduled states
    const scheduledSnap = await this.db.collection("publishing_queue").where("status", "in", ["scheduled", "SCHEDULED"]).get();
    scheduledSnap.forEach(doc => candidateJobs.push(doc.data() as PublishingJob));

    const activeCandidates = candidateJobs
      .filter(job => {
        const nextRunPast = job.nextRunAt <= nowStr;
        const unleased = !job.leaseToken || !job.leaseExpiresAt || job.leaseExpiresAt <= nowStr;
        // Don't lease published, cancelled, dead_letter, aborted jobs
        const canLeaseStatus = ["queued", "QUEUED", "failed", "RETRY_WAIT", "scheduled", "SCHEDULED", "leased", "LEASED", "EXECUTING"].includes(job.status);
        return nextRunPast && unleased && canLeaseStatus;
      })
      .sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt))
      .slice(0, limit);

    for (const cand of activeCandidates) {
      const docRef = this.db.collection("publishing_queue").doc(cand.jobId);
      const leaseToken = uuidv4();
      const leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      try {
        const resultJob = await this.db.runTransaction(async (transaction) => {
          const doc = await transaction.get(docRef);
          if (!doc.exists) return null;
          
          const currentJob = doc.data() as PublishingJob;
          const isSTILLCandidate = 
            ["queued", "QUEUED", "failed", "RETRY_WAIT", "scheduled", "SCHEDULED", "leased", "LEASED", "EXECUTING"].includes(currentJob.status) &&
            (!currentJob.leaseToken || !currentJob.leaseExpiresAt || currentJob.leaseExpiresAt <= nowStr);

          if (!isSTILLCandidate) return null;

          const leasedJobPayload: PublishingJob = {
            ...currentJob,
            status: "LEASED",
            leaseToken,
            leaseOwnerId: workerId,
            leaseAcquiredAt: nowStr,
            leaseExpiresAt
          };

          return await this.appendAuditEvent(
            transaction,
            docRef,
            leasedJobPayload,
            "LEASED",
            "LEASE_ACQUIRED",
            `Job leased by ${workerId} with token: ${leaseToken}. Expires: ${leaseExpiresAt}`,
            workerId
          );
        });

        if (resultJob) {
          leasedJobs.push(resultJob);
        }
      } catch (err) {
        console.error(`[QUEUE] Leasing failed for job ${cand.jobId}:`, err);
      }
    }

    return leasedJobs;
  }

  /**
   * Automatic WordPress Post Reconciliation
   */
  async reconcileWordPressPost(pkg: FinalArticlePackage, wpConfig: any): Promise<{ outcome: string; postId?: number; postUrl?: string; error?: string }> {
    if (!wpConfig || !wpConfig.url || !wpConfig.username || !wpConfig.appPassword) {
      return { outcome: "REMOTE_MISSING" };
    }

    try {
      const rootUrl = wpConfig.url.replace(/\/$/, "");
      const slug = pkg.editorialContent.slug;
      const wpSearchUrl = `${rootUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any`;
      const token = Buffer.from(`${wpConfig.username}:${wpConfig.appPassword}`).toString("base64");

      console.log(`[RECONCILIATION] Checking slug: ${slug} at ${wpSearchUrl}`);
      const res = await fetch(wpSearchUrl, {
        headers: {
          "Authorization": `Basic ${token}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(10000)
      });

      if (res.status === 401 || res.status === 403) {
        return { outcome: "AUTHENTICATION_FAILURE", error: "Invalid WordPress site credentials" };
      }

      if (!res.ok) {
        return { outcome: "TEMPORARY_FAILURE", error: `WP API returned code ${res.status}` };
      }

      const posts = await res.json();
      if (!Array.isArray(posts) || posts.length === 0) {
        return { outcome: "REMOTE_MISSING" };
      }

      if (posts.length > 1) {
        return { outcome: "MULTIPLE_MATCHES", error: `Found ${posts.length} duplicate posts for slug "${slug}"` };
      }

      // Exact single post match
      const remotePost = posts[0];
      const parsedMatch = WordpressResponseSchema.safeParse(remotePost);
      if (!parsedMatch.success) {
        return { outcome: "CONTENT_DRIFT", error: "Malformed WordPress API payload schema" };
      }

      const expectedTitle = pkg.editorialContent.title;
      const remoteTitle = remotePost.title?.rendered || "";
      const isContentMatched = remoteTitle.toLowerCase() === expectedTitle.toLowerCase();

      if (!isContentMatched) {
        return { outcome: "CONTENT_DRIFT", error: `Slug matches but title drifts: "${remoteTitle}" != "${expectedTitle}"` };
      }

      return {
        outcome: "MATCHED",
        postId: remotePost.id,
        postUrl: remotePost.link
      };
    } catch (err: any) {
      console.error(`[RECONCILIATION] WP fetch threw exception:`, err.message);
      return { outcome: "TEMPORARY_FAILURE", error: err.message };
    }
  }

  /**
   * Executes a leased publishing job. Enforces owner lease tokens.
   */
  async executeJob(jobId: string, leaseToken: string): Promise<PublishingJob> {
    const jobDocRef = this.db.collection("publishing_queue").doc(jobId);
    
    const leaseCheck = await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(jobDocRef);
      if (!snap.exists) throw new Error(`Job ${jobId} not found.`);
      
      const job = snap.data() as PublishingJob;
      const nowStr = new Date().toISOString();

      if (job.status !== "LEASED") {
        throw new Error(`Job ${jobId} is not leased. Active Status: ${job.status}`);
      }

      if (job.leaseToken !== leaseToken) {
        throw new Error(`[LEASE_ERROR] Stale or unowned lease token. Expected: ${job.leaseToken}, Received: ${leaseToken}`);
      }

      if (job.leaseExpiresAt && job.leaseExpiresAt <= nowStr) {
        throw new Error(`[LEASE_ERROR] Lease expired at ${job.leaseExpiresAt}. Current time: ${nowStr}`);
      }

      // Validated. Transition status to EXECUTING
      return await this.appendAuditEvent(
        transaction,
        jobDocRef,
        job,
        "EXECUTING",
        "EXECUTION_STARTED",
        `Job execution cycle started. Lease validated. Token: ${leaseToken}`,
        job.leaseOwnerId || "worker"
      );
    });

    let job = leaseCheck;

    // 1. Fetch package details
    const pkgSnap = await this.db.collection("phase_d_packages").doc(job.packageId).get();
    if (!pkgSnap.exists) {
      return await this.appendAuditEvent(
        null,
        jobDocRef,
        { ...job, lastError: "FinalArticlePackage record missing on disk." },
        "TECHNICAL_FAILURE",
        "EXECUTION_FAILED",
        "Associated FinalArticlePackage missing on disk.",
        job.leaseOwnerId || "worker"
      );
    }
    const pkg = pkgSnap.data() as FinalArticlePackage;

    // 2. Fetch WordPress configuration
    const saasSettingsSnap = await this.db.collection("settings").doc("saas").get();
    const saasConfig = saasSettingsSnap.exists ? saasSettingsSnap.data() : {};
    
    let wpConfig = null;
    const sites = saasConfig?.wordpressSites || [];
    const matchedSite = sites.find((s: any) => s.id === job.targetSiteId);
    
    if (matchedSite) {
      wpConfig = matchedSite;
    } else {
      const niche = pkg.editorialContent.nichePlaybookId || "general";
      wpConfig = saasConfig?.wordpress?.[niche];
    }

    const runCount = job.runCount + 1;
    let updatedJobState = { ...job, runCount };

    try {
      // PRE-PUBLICATION AUTOMATIC RECONCILIATION
      const reconciliation = await this.reconcileWordPressPost(pkg, wpConfig);
      
      if (reconciliation.outcome === "MATCHED") {
        console.log(`[QUEUE] [RECONCILIATION] Duplicate remote post discovered. Local reference repaired.`);
        
        await this.db.collection("phase_d_packages").doc(job.packageId).update({
          "publishingTarget.permalinkPreview": reconciliation.postUrl
        });

        return await this.appendAuditEvent(
          null,
          jobDocRef,
          {
            ...updatedJobState,
            wordpressPostId: reconciliation.postId!,
            destinationUrl: reconciliation.postUrl!,
            leaseToken: null,
            leaseOwnerId: null,
            leaseExpiresAt: null,
            lastError: null
          },
          "PUBLISHED",
          "LOCAL_REFERENCE_REPAIRED",
          `Post was found on WordPress. Repaired references. ID: ${reconciliation.postId}, URL: ${reconciliation.postUrl}`,
          job.leaseOwnerId || "worker"
        );
      }

      if (["MULTIPLE_MATCHES", "CONTENT_DRIFT"].includes(reconciliation.outcome)) {
        return await this.appendAuditEvent(
          null,
          jobDocRef,
          {
            ...updatedJobState,
            leaseToken: null,
            leaseOwnerId: null,
            leaseExpiresAt: null,
            lastError: reconciliation.error || "Reconciliation mismatch detected"
          },
          "MANUAL_INTERVENTION_REQUIRED",
          "RECONCILIATION_FAILED",
          `Conflict: ${reconciliation.outcome}. Error: ${reconciliation.error}`,
          job.leaseOwnerId || "worker"
        );
      }

      if (!pushToWpAdapter) {
        throw new Error("WordPress publishing adapter is not initialized inside Queue Service.");
      }

      const articlePayloadForAdapter = {
        id: pkg.articleId,
        title: pkg.editorialContent.title,
        content: pkg.editorialContent.bodyHtml,
        originalImageUrl: pkg.media?.featuredImageReference,
        tags: pkg.publishingTarget.mappedTagIds,
        niche: pkg.editorialContent.nichePlaybookId,
        seo: {
          title: pkg.seo?.seoTitle,
          focusKeyword: pkg.seo?.primaryKeyword,
          metaDescriptionOverride: pkg.seo?.metaDescription
        }
      };

      const result = await pushToWpAdapter(articlePayloadForAdapter, wpConfig);

      if (result && result.status === "success" && (result.postId || result.id)) {
        const wpPostId = result.postId || result.id;
        const postUrl = result.postUrl || result.link;

        await this.db.collection("phase_d_packages").doc(job.packageId).update({
          "publishingTarget.permalinkPreview": postUrl
        });

        return await this.appendAuditEvent(
          null,
          jobDocRef,
          {
            ...updatedJobState,
            wordpressPostId: wpPostId,
            destinationUrl: postUrl,
            leaseToken: null,
            leaseOwnerId: null,
            leaseExpiresAt: null,
            lastError: null
          },
          "PUBLISHED",
          "PUBLISHED_TO_WORDPRESS",
          `Draft successfully published to WordPress. ID: ${wpPostId}. URL: ${postUrl}`,
          job.leaseOwnerId || "worker"
        );
      } else {
        throw new Error(result?.error || "WordPress integration rejected payload.");
      }

    } catch (dispatchError: any) {
      console.error(`[QUEUE] Execution caught exception for job ${jobId}:`, dispatchError.message);

      // POST-PUBLICATION AUTOMATIC RECONCILIATION (Double check before rescheduling)
      const postRecovery = await this.reconcileWordPressPost(pkg, wpConfig);
      if (postRecovery.outcome === "MATCHED") {
        await this.db.collection("phase_d_packages").doc(job.packageId).update({
          "publishingTarget.permalinkPreview": postRecovery.postUrl
        });

        return await this.appendAuditEvent(
          null,
          jobDocRef,
          {
            ...updatedJobState,
            wordpressPostId: postRecovery.postId!,
            destinationUrl: postRecovery.postUrl!,
            leaseToken: null,
            leaseOwnerId: null,
            leaseExpiresAt: null,
            lastError: null
          },
          "PUBLISHED",
          "RECONCILIATION_RECOVERY_SUCCESS",
          `Ambiguous failure successfully recovered. Verified Post ID: ${postRecovery.postId}, URL: ${postRecovery.postUrl}`,
          job.leaseOwnerId || "worker"
        );
      }

      // Classify error transient vs non-transient
      const classification = classifyFailure(dispatchError);
      const isRetryable = classification.isRetryable && runCount < job.maxRetries;

      if (isRetryable) {
        // Reschedule with bounded exponential backoff + jitter
        const backoffBase = 60; // 1 minute
        const delaySeconds = Math.min(3600, backoffBase * Math.pow(2, runCount - 1)) + Math.random() * 10;
        const nextRunAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

        return await this.appendAuditEvent(
          null,
          jobDocRef,
          {
            ...updatedJobState,
            leaseToken: null,
            leaseOwnerId: null,
            leaseExpiresAt: null,
            nextRunAt,
            lastError: dispatchError.message
          },
          "RETRY_WAIT",
          "RETRY_SCHEDULED",
          `Transient failure classified (${classification.failureClass}). Scheduling retry #${runCount + 1} for ${nextRunAt}`,
          job.leaseOwnerId || "worker"
        );
      } else {
        // Exhausted or non-retryable fatal error
        const terminalState: JobStatus = classification.isRetryable ? "DEAD_LETTER" : "MANUAL_INTERVENTION_REQUIRED";
        const actionType = classification.isRetryable ? "TRANSITION_TO_DEAD_LETTER" : "FATAL_CLASSIFICATION";

        return await this.appendAuditEvent(
          null,
          jobDocRef,
          {
            ...updatedJobState,
            leaseToken: null,
            leaseOwnerId: null,
            leaseExpiresAt: null,
            lastError: dispatchError.message
          },
          terminalState,
          actionType,
          `Continuous failure or fatal error classified (${classification.failureClass}). Sent to terminal status: ${terminalState}`,
          job.leaseOwnerId || "worker"
        );
      }
    }
  }

  /**
   * Action: Force retry a dead_letter or failed job immediately
   */
  async forceRetryJob(jobId: string, operatorId: string = "admin"): Promise<PublishingJob> {
    const docRef = this.db.collection("publishing_queue").doc(jobId);
    
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error("Job not found");

      const currentJob = snap.data() as PublishingJob;
      const updatedJobPayload: PublishingJob = {
        ...currentJob,
        status: "QUEUED",
        runCount: 0,
        nextRunAt: new Date().toISOString(),
        leaseToken: null,
        leaseOwnerId: null,
        leaseExpiresAt: null,
        lastError: null
      };

      return await this.appendAuditEvent(
        transaction,
        docRef,
        updatedJobPayload,
        "QUEUED",
        "FORCE_RETRY_TRIGGERED",
        "Manual administrative override: Job reset to queued status for immediate syndication.",
        operatorId
      );
    });
  }

  /**
   * Action: Secure Manual Resolution
   */
  async manuallyResolveJob(
    jobId: string, 
    wpPostId: string | number, 
    destinationUrl: string, 
    operatorId: string = "admin"
  ): Promise<PublishingJob> {
    const docRef = this.db.collection("publishing_queue").doc(jobId);

    // Run within a transaction to guarantee data safety and prevent races
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error("Job not found");

      const currentJob = snap.data() as PublishingJob;

      // 1. Verify Permitted States
      const allowedManualResolveStates = [
        "FAILED", "failed", 
        "DEAD_LETTER", "dead_letter", 
        "RECONCILIATION_REQUIRED", "MANUAL_INTERVENTION_REQUIRED", 
        "TECHNICAL_FAILURE"
      ];
      if (!allowedManualResolveStates.includes(currentJob.status)) {
        throw new Error(`Current job state '${currentJob.status}' is not permitted for manual resolution override.`);
      }

      // 2. Validate Untrusted Destination URL and protocol
      if (!destinationUrl.startsWith("http://") && !destinationUrl.startsWith("https://")) {
        throw new Error("Invalid URL protocol. Only HTTP/HTTPS destinations are permitted.");
      }

      // 3. Fetch package to cross-reference
      const pkgSnap = await transaction.get(this.db.collection("phase_d_packages").doc(currentJob.packageId));
      if (!pkgSnap.exists) throw new Error("Associated FinalArticlePackage not found.");
      const pkg = pkgSnap.data() as FinalArticlePackage;

      // 4. Check for duplicate manual usage
      const dupQuery = await this.db.collection("publishing_queue")
        .where("wordpressPostId", "==", Number(wpPostId))
        .get();

      if (!dupQuery.empty) {
        const dupFound = dupQuery.docs.find(d => d.id !== jobId);
        if (dupFound) {
          throw new Error(`[SECURITY GATE] WordPress Post ID ${wpPostId} is already claimed by another active job (${dupFound.id}).`);
        }
      }

      // 5. Update package
      transaction.update(this.db.collection("phase_d_packages").doc(currentJob.packageId), {
        "publishingTarget.permalinkPreview": destinationUrl
      });

      const updatedJobPayload: PublishingJob = {
        ...currentJob,
        status: "PUBLISHED",
        wordpressPostId: Number(wpPostId),
        destinationUrl,
        leaseToken: null,
        leaseOwnerId: null,
        leaseExpiresAt: null,
        lastError: null
      };

      return await this.appendAuditEvent(
        transaction,
        docRef,
        updatedJobPayload,
        "PUBLISHED",
        "MANUAL_RESOLUTION_APPLIED",
        `Manual resolution verified. WordPress Post ID: ${wpPostId}, URL: ${destinationUrl}`,
        operatorId
      );
    });
  }

  /**
   * Action: Abort/cancel job completely
   */
  async abortJob(jobId: string, reason: string, operatorId: string = "admin"): Promise<PublishingJob> {
    const docRef = this.db.collection("publishing_queue").doc(jobId);
    
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error("Job not found");

      const currentJob = snap.data() as PublishingJob;
      const updatedJobPayload: PublishingJob = {
        ...currentJob,
        status: "CANCELLED",
        leaseToken: null,
        leaseOwnerId: null,
        leaseExpiresAt: null,
        lastError: `Cancelled by operator. Reason: ${reason}`
      };

      return await this.appendAuditEvent(
        transaction,
        docRef,
        updatedJobPayload,
        "CANCELLED",
        "JOB_CANCELLED",
        `Job permanently aborted/cancelled. Reason: ${reason}`,
        operatorId
      );
    });
  }

  /**
   * Run the worker processor against leased jobs
   */
  async runWorkerCycle(limit: number = 3): Promise<{ leasedCount: number; results: string[] }> {
    console.log("[QUEUE] Worker cycle invoked. Acquiring leases...");
    const workerId = `worker_${uuidv4().substring(0, 8)}`;
    const leased = await this.leaseNextJobs(limit, workerId);
    const results: string[] = [];

    for (const job of leased) {
      try {
        console.log(`[QUEUE] Worker executing job: ${job.jobId}`);
        const completedJob = await this.executeJob(job.jobId, job.leaseToken!);
        results.push(`Job ${job.jobId} processed: transitioned to ${completedJob.status}`);
      } catch (err: any) {
        console.error(`[QUEUE] Worker failed executing job ${job.jobId}:`, err.message);
        results.push(`Job ${job.jobId} error: ${err.message}`);
      }
    }

    return {
      leasedCount: leased.length,
      results
    };
  }
}
