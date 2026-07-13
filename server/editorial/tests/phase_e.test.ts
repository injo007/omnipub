import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetInMemoryDocumentStore, seedDocument, getDocumentStore } from "../../db/documentStore";
import { PublishingQueueService, classifyFailure, setPushToWordPressAdapter } from "../publishingQueueService";
import { calculateJobIdempotencyKey, isValidTransition, type PublishingJob } from "../publishingQueueTypes";

const approvedPackage = (id = "pkg_1") => ({
  packageId: id,
  articleId: id.replace("pkg_", ""),
  packageVersion: 1,
  packageStatus: "APPROVED_FOR_PUBLISHING",
  editorialContent: {
    title: "PostgreSQL Queue Test",
    slug: "postgresql-queue-test",
    bodyHtml: "<p>Body</p>",
    bodyTextHash: "hash-1",
    nichePlaybookId: "tech"
  },
  publishingTarget: { wordpressSiteId: "site-a", mappedTagIds: [] },
  media: {},
  seo: {}
});

const jobRecord = (overrides: Partial<PublishingJob> = {}): PublishingJob => ({
  jobId: "job_1",
  packageId: "pkg_1",
  targetSiteId: "site-a",
  status: "LEASED",
  leaseToken: "lease-a",
  leaseOwnerId: "worker-a",
  leaseAcquiredAt: new Date().toISOString(),
  leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  revision: 0,
  runCount: 0,
  maxRetries: 3,
  nextRunAt: new Date(Date.now() - 1000).toISOString(),
  scheduledPublishAt: null,
  lastError: null,
  wordpressPostId: null,
  destinationUrl: null,
  trackingToken: "tracking-a",
  auditHistory: [],
  articleTitle: "PostgreSQL Queue Test",
  ...overrides
});

describe("Phase E PostgreSQL queue state machine", () => {
  it("allows valid transitions and blocks terminal-state escapes", () => {
    expect(isValidTransition("QUEUED", "LEASED")).toBe(true);
    expect(isValidTransition("LEASED", "EXECUTING")).toBe(true);
    expect(isValidTransition("EXECUTING", "PUBLISHED")).toBe(true);
    expect(isValidTransition("PUBLISHED", "LEASED")).toBe(false);
    expect(isValidTransition("CANCELLED", "LEASED")).toBe(false);
  });

  it("normalizes legacy lowercase states", () => {
    expect(isValidTransition("queued", "leased")).toBe(true);
    expect(isValidTransition("executing", "published")).toBe(true);
  });

  it("builds stable SHA-256 idempotency keys", () => {
    const input = {
      packageId: "pkg_1", packageVersion: 1, packageHash: "hash-1",
      targetSiteId: "site-a", desiredAction: "publish", desiredStatus: "QUEUED",
      scheduleTimestamp: null
    };
    expect(calculateJobIdempotencyKey(input)).toBe(calculateJobIdempotencyKey(input));
    expect(calculateJobIdempotencyKey(input)).toHaveLength(64);
    expect(calculateJobIdempotencyKey({ ...input, packageVersion: 2 })).not.toBe(calculateJobIdempotencyKey(input));
  });
});

describe("Phase E PostgreSQL publishing service", () => {
  let service: PublishingQueueService;

  beforeEach(() => {
    resetInMemoryDocumentStore();
    service = new PublishingQueueService(60_000);
    vi.restoreAllMocks();
    setPushToWordPressAdapter(async () => ({ status: "success", postId: 91, postUrl: "https://site.test/post" }));
  });

  it("creates one durable job for an approved package", async () => {
    await seedDocument("phase_d_packages", "pkg_1", approvedPackage());
    const first = await service.addJob("pkg_1");
    const second = await service.addJob("pkg_1");
    expect(first.status).toBe("QUEUED");
    expect(second.jobId).toBe(first.jobId);
    const rows = await getDocumentStore().collection("publishing_queue").get();
    expect(rows.docs).toHaveLength(1);
  });

  it("creates scheduled jobs with a future run time", async () => {
    await seedDocument("phase_d_packages", "pkg_1", { ...approvedPackage(), packageStatus: "SCHEDULED" });
    const future = new Date(Date.now() + 60_000).toISOString();
    const job = await service.addJob("pkg_1", future);
    expect(job.status).toBe("SCHEDULED");
    expect(job.nextRunAt).toBe(future);
  });

  it("rejects missing and blocked packages", async () => {
    await expect(service.addJob("missing")).rejects.toThrow("does not exist");
    await seedDocument("phase_d_packages", "blocked", { ...approvedPackage("blocked"), packageStatus: "NEEDS_MANUAL_REVIEW" });
    await expect(service.addJob("blocked")).rejects.toThrow("Only packages");
  });

  it("leases an eligible queued job", async () => {
    await seedDocument("publishing_queue", "job_1", jobRecord({ status: "QUEUED", leaseToken: null, leaseOwnerId: null, leaseExpiresAt: null }));
    const leased = await service.leaseNextJobs(1, "worker-b");
    expect(leased).toHaveLength(1);
    expect(leased[0].status).toBe("LEASED");
    expect(leased[0].leaseOwnerId).toBe("worker-b");
  });

  it("recovers an expired lease but not an active lease", async () => {
    await seedDocument("publishing_queue", "expired", jobRecord({ jobId: "expired", leaseExpiresAt: new Date(Date.now() - 1000).toISOString() }));
    await seedDocument("publishing_queue", "active", jobRecord({ jobId: "active", leaseExpiresAt: new Date(Date.now() + 60_000).toISOString() }));
    const leased = await service.leaseNextJobs(5, "worker-b");
    expect(leased.map((job) => job.jobId)).toContain("expired");
    expect(leased.map((job) => job.jobId)).not.toContain("active");
  });

  it("renews only the current lease owner token", async () => {
    await seedDocument("publishing_queue", "job_1", jobRecord());
    await expect(service.renewLease("job_1", "wrong-token")).resolves.toBe(false);
    await expect(service.renewLease("job_1", "lease-a")).resolves.toBe(true);
  });

  it("rejects stale and expired execution leases", async () => {
    await seedDocument("publishing_queue", "job_1", jobRecord());
    await expect(service.executeJob("job_1", "wrong-token")).rejects.toThrow("LEASE_ERROR");
    await seedDocument("publishing_queue", "expired", jobRecord({ jobId: "expired", leaseExpiresAt: new Date(Date.now() - 1000).toISOString() }));
    await expect(service.executeJob("expired", "lease-a")).rejects.toThrow("Lease expired");
  });

  it("publishes successfully and persists the WordPress identifiers", async () => {
    await seedDocument("phase_d_packages", "pkg_1", approvedPackage());
    await seedDocument("settings", "saas", { wordpressSites: [{ id: "site-a" }] });
    await seedDocument("publishing_queue", "job_1", jobRecord());
    const result = await service.executeJob("job_1", "lease-a");
    expect(result.status).toBe("PUBLISHED");
    expect(result.wordpressPostId).toBe(91);
    expect(result.destinationUrl).toBe("https://site.test/post");
  });

  it("moves transient failures into retry wait", async () => {
    setPushToWordPressAdapter(async () => { throw Object.assign(new Error("network timeout"), { status: 503 }); });
    await seedDocument("phase_d_packages", "pkg_1", approvedPackage());
    await seedDocument("settings", "saas", { wordpressSites: [{ id: "site-a" }] });
    await seedDocument("publishing_queue", "job_1", jobRecord());
    const result = await service.executeJob("job_1", "lease-a");
    expect(result.status).toBe("RETRY_WAIT");
    expect(result.lastError).toContain("network timeout");
  });

  it("supports secure manual resolution and prevents duplicate post IDs", async () => {
    await seedDocument("phase_d_packages", "pkg_1", approvedPackage());
    await seedDocument("publishing_queue", "job_1", jobRecord({ status: "DEAD_LETTER" }));
    const resolved = await service.manuallyResolveJob("job_1", 77, "https://site.test/resolved");
    expect(resolved.status).toBe("PUBLISHED");
    await seedDocument("publishing_queue", "job_2", jobRecord({ jobId: "job_2", status: "DEAD_LETTER", wordpressPostId: null }));
    await expect(service.manuallyResolveJob("job_2", 77, "https://site.test/other")).rejects.toThrow("already claimed");
  });

  it("validates manual destination protocols", async () => {
    await seedDocument("phase_d_packages", "pkg_1", approvedPackage());
    await seedDocument("publishing_queue", "job_1", jobRecord({ status: "DEAD_LETTER" }));
    await expect(service.manuallyResolveJob("job_1", 77, "ftp://site.test/post")).rejects.toThrow("protocol");
  });

  it("cancels jobs and records an audit transition", async () => {
    await seedDocument("publishing_queue", "job_1", jobRecord({ status: "QUEUED", leaseToken: null }));
    const cancelled = await service.abortJob("job_1", "operator request");
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.auditHistory.at(-1)?.action).toBe("JOB_CANCELLED");
  });

  it("stops new leases while draining", async () => {
    service.setDraining(true);
    expect(await service.leaseNextJobs()).toEqual([]);
    expect(await service.runWorkerCycle()).toEqual({ leasedCount: 0, results: [] });
  });
});

describe("Phase E failure classification", () => {
  it("classifies retryable network failures", () => {
    expect(classifyFailure({ status: 504, message: "timeout" })).toEqual({ failureClass: "NETWORK_TRANSIENT", isRetryable: true });
  });
  it("classifies authentication and payload failures as terminal", () => {
    expect(classifyFailure({ status: 401, message: "unauthorized" }).isRetryable).toBe(false);
    expect(classifyFailure({ status: 400, message: "bad request" }).isRetryable).toBe(false);
  });
});
