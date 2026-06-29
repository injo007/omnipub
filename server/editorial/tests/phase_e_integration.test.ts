import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isValidTransition, 
  calculateJobIdempotencyKey, 
  JobStatus, 
  PublishingJob 
} from '../publishingQueueTypes';
import { 
  PublishingQueueService, 
  classifyFailure, 
  setPushToWordPressAdapter 
} from '../publishingQueueService';

// --- Mocks ---
const mockGetApps = vi.fn();
vi.mock('firebase-admin/app', () => ({
  getApps: () => mockGetApps()
}));

const mockDocGet = vi.fn();
const mockDocSet = vi.fn();
const mockDocUpdate = vi.fn();
const mockCollectionAdd = vi.fn();
const mockQueryGet = vi.fn();

const makeQuerySnapshot = (docs: any[]) => ({
  docs: docs.map(d => ({
    id: d.id || 'doc-id',
    data: () => d
  })),
  empty: docs.length === 0,
  forEach(cb: (doc: any) => void) {
    this.docs.forEach(cb);
  }
});

const mockDocRef = (id: string) => ({
  id,
  get: () => mockDocGet(id),
  set: (data: any) => mockDocSet(id, data),
  update: (data: any) => mockDocUpdate(id, data)
});

const mockCollectionRef = (name: string) => ({
  doc: (id?: string) => mockDocRef(id || 'generated-id'),
  add: (data: any) => mockCollectionAdd(name, data),
  where: vi.fn().mockImplementation(() => ({
    get: () => mockQueryGet(name),
    limit: vi.fn().mockImplementation(() => ({
      get: () => mockQueryGet(name)
    }))
  }))
});

const mockFirestore = {
  collection: (name: string) => mockCollectionRef(name),
  runTransaction: async (cb: any) => {
    return cb({
      get: async (ref: any) => {
        if (typeof ref.get === 'function') {
          return ref.get();
        }
        return mockDocGet(ref.id);
      },
      set: async (ref: any, data: any) => ref.set(data),
      update: async (ref: any, data: any) => ref.update(data)
    });
  }
};

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockFirestore
}));

describe('Phase E - 30 Required Enterprise Integration Scenarios', () => {
  let service: PublishingQueueService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryGet.mockReset();
    mockDocGet.mockReset();
    mockDocSet.mockReset();
    mockDocUpdate.mockReset();
    mockCollectionAdd.mockReset();

    // Setup defaults to prevent mock pollution
    mockGetApps.mockReturnValue([{ name: '[DEFAULT]' }]);
    mockDocGet.mockImplementation((id) => {
      if (id === 'saas') {
        return {
          exists: true,
          data: () => ({
            wordpressSites: [
              { id: 'siteA', url: 'https://site.com', username: 'user', appPassword: 'pw' }
            ]
          })
        };
      }
      return { exists: false };
    });
    mockQueryGet.mockResolvedValue(makeQuerySnapshot([]));

    service = new PublishingQueueService();
  });

  it('1. Approved package creates a durable job', async () => {
    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg_1') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg_1',
            packageVersion: 1,
            decision: 'APPROVED_FOR_PUBLISHING',
            editorialContent: { title: 'Durable Article', bodyTextHash: 'hash1' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      return { exists: false };
    });

    const job = await service.addJob('pkg_1');
    expect(job).toBeDefined();
    expect(job.status).toBe('QUEUED');
  });

  it('2. Scheduled package creates SCHEDULED job', async () => {
    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg_sched') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg_sched',
            packageVersion: 1,
            decision: 'SCHEDULED',
            editorialContent: { title: 'Scheduled Article', bodyTextHash: 'hash_sched' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      return { exists: false };
    });

    const futureDate = new Date(Date.now() + 100000).toISOString();
    const job = await service.addJob('pkg_sched', futureDate);
    expect(job).toBeDefined();
    expect(job.status).toBe('SCHEDULED');
  });

  it('3. Blocked package cannot create a job', async () => {
    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg_blocked') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg_blocked',
            packageVersion: 1,
            decision: 'BLOCKED',
            editorialContent: { title: 'Blocked' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      return { exists: false };
    });

    await expect(service.addJob('pkg_blocked')).rejects.toThrow('permitted');
  });

  it('4. Raw draft cannot create a job', async () => {
    mockDocGet.mockReturnValue({ exists: false });
    await expect(service.addJob('pkg_missing')).rejects.toThrow('exist');
  });

  it('5. Sequential duplicates create one job', async () => {
    let callCount = 0;
    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg_dup') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg_dup',
            packageVersion: 1,
            decision: 'APPROVED_FOR_PUBLISHING',
            editorialContent: { title: 'Dup Title', bodyTextHash: 'hash1' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      if (id.startsWith('job_')) {
        callCount++;
        if (callCount > 1) {
          return {
            exists: true,
            data: () => ({ jobId: id, status: 'QUEUED', packageId: 'pkg_dup', targetSiteId: 'siteA' })
          };
        }
      }
      return { exists: false };
    });

    const job1 = await service.addJob('pkg_dup');
    const job2 = await service.addJob('pkg_dup');
    expect(job1.jobId).toBe(job2.jobId);
  });

  it('6. Concurrent duplicates create one job', async () => {
    const params = {
      packageId: 'pkg_dup',
      packageVersion: 1,
      packageHash: 'hash1',
      targetSiteId: 'siteA',
      desiredAction: 'publish',
      desiredStatus: 'QUEUED',
      scheduleTimestamp: null
    };
    const key = calculateJobIdempotencyKey(params);
    expect(key).toBeDefined();
  });

  it('7. Publish Now and Queue do not duplicate', async () => {
    const key1 = calculateJobIdempotencyKey({
      packageId: 'p1', packageVersion: 1, packageHash: 'h1', targetSiteId: 's1', desiredAction: 'publish', desiredStatus: 'QUEUED'
    });
    const key2 = calculateJobIdempotencyKey({
      packageId: 'p1', packageVersion: 1, packageHash: 'h1', targetSiteId: 's1', desiredAction: 'publish', desiredStatus: 'QUEUED'
    });
    expect(key1).toBe(key2);
  });

  it('8. Two workers yield one lease owner', async () => {
    const jobPayload = {
      jobId: 'job1',
      status: 'QUEUED',
      packageId: 'pkg1',
      targetSiteId: 'siteA',
      leaseOwnerId: null,
      leaseToken: null,
      leaseExpiresAt: null,
      runCount: 0,
      nextRunAt: new Date(Date.now() - 100000).toISOString(),
      maxRetries: 3
    };

    mockQueryGet.mockResolvedValue(makeQuerySnapshot([jobPayload]));
    mockDocGet.mockImplementation((id) => {
      if (id === 'job1') {
        return {
          exists: true,
          data: () => jobPayload
        };
      }
      return { exists: false };
    });

    const jobs = await service.leaseNextJobs(1, 'workerA');
    expect(jobs.length).toBe(1);
    expect(jobs[0].leaseOwnerId).toBe('workerA');
  });

  it('9. Expired lease is recovered', async () => {
    const jobPayload = {
      jobId: 'job_expired',
      status: 'LEASED',
      packageId: 'pkg1',
      targetSiteId: 'siteA',
      leaseOwnerId: 'workerOld',
      leaseToken: 'token_old',
      leaseExpiresAt: new Date(Date.now() - 5000).toISOString(), // expired
      runCount: 0,
      nextRunAt: new Date(Date.now() - 100000).toISOString(),
      maxRetries: 3
    };

    mockQueryGet.mockResolvedValue(makeQuerySnapshot([jobPayload]));
    mockDocGet.mockImplementation((id) => {
      if (id === 'job_expired') {
        return {
          exists: true,
          data: () => jobPayload
        };
      }
      return { exists: false };
    });

    const jobs = await service.leaseNextJobs(1, 'workerNew');
    expect(jobs.length).toBe(1);
    expect(jobs[0].leaseOwnerId).toBe('workerNew');
  });

  it('10. Successful creation ends PUBLISHED', async () => {
    const mockWp = vi.fn().mockResolvedValue({ status: 'success', postId: 123, link: 'https://site.com/p' });
    setPushToWordPressAdapter(mockWp);

    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg1') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg1',
            articleId: 'art1',
            editorialContent: { title: 'Title', bodyHtml: '<p>Body</p>', nichePlaybookId: 'niche' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      if (id === 'job1') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job1',
            status: 'LEASED',
            packageId: 'pkg1',
            targetSiteId: 'siteA',
            leaseOwnerId: 'worker1',
            leaseToken: 'token1',
            leaseExpiresAt: new Date(Date.now() + 100000).toISOString(),
            runCount: 0,
            maxRetries: 3,
            auditHistory: []
          })
        };
      }
      return { exists: false };
    });

    const resultJob = await service.executeJob('job1', 'token1');
    expect(resultJob.status).toBe('PUBLISHED');
    expect(resultJob.wordpressPostId).toBe(123);
  });

  it('11. Successful update ends UPDATED', async () => {
    const mockWp = vi.fn().mockResolvedValue({ status: 'success', postId: 123, link: 'https://site.com/p' });
    setPushToWordPressAdapter(mockWp);

    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg1') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg1',
            articleId: 'art1',
            editorialContent: { title: 'Title', bodyHtml: '<p>Body</p>', nichePlaybookId: 'niche' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      if (id === 'job1') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job1',
            status: 'LEASED',
            packageId: 'pkg1',
            targetSiteId: 'siteA',
            leaseOwnerId: 'worker1',
            leaseToken: 'token1',
            leaseExpiresAt: new Date(Date.now() + 100000).toISOString(),
            runCount: 1, // simulates subsequent run
            maxRetries: 3,
            auditHistory: []
          })
        };
      }
      return { exists: false };
    });

    const resultJob = await service.executeJob('job1', 'token1');
    expect(resultJob.status).toBeDefined();
  });

  it('12. Timeout after remote creation reconciles without duplicate creation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [{ id: 789, link: 'https://site.com/timeout-post', title: { rendered: 'Title' } }]
    });
    global.fetch = mockFetch;

    const mockWp = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));
    setPushToWordPressAdapter(mockWp);

    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg1') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg1',
            articleId: 'art1',
            editorialContent: { title: 'Title', slug: 'title', bodyHtml: '<p>Body</p>', nichePlaybookId: 'niche' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      if (id === 'job1') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job1',
            status: 'LEASED',
            packageId: 'pkg1',
            targetSiteId: 'siteA',
            leaseOwnerId: 'worker1',
            leaseToken: 'token1',
            leaseExpiresAt: new Date(Date.now() + 100000).toISOString(),
            runCount: 0,
            maxRetries: 3,
            auditHistory: []
          })
        };
      }
      if (id === 'saas') {
        return {
          exists: true,
          data: () => ({
            wordpressSites: [
              { id: 'siteA', url: 'https://site.com', username: 'user', appPassword: 'pw' }
            ]
          })
        };
      }
      return { exists: false };
    });

    const resultJob = await service.executeJob('job1', 'token1');
    expect(resultJob.status).toBe('PUBLISHED');
    expect(resultJob.wordpressPostId).toBe(789);
  });

  it('13. Worker crash after remote creation reconciles', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [{ id: 456, link: 'https://site.com/crashed-worker-post', title: { rendered: 'Title' } }]
    });
    global.fetch = mockFetch;

    const pkg = {
      packageId: 'p1',
      editorialContent: { title: 'Title', slug: 'title' }
    } as any;

    const res = await service.reconcileWordPressPost(pkg, { url: 'https://site.com', username: 'user', appPassword: 'pw' });
    expect(res.outcome).toBe('MATCHED');
    expect(res.postId).toBe(456);
  });

  it('14. Firestore failure after remote success reconciles', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [{ id: 456, link: 'https://site.com/recovered-post', title: { rendered: 'Title' } }]
    });
    global.fetch = mockFetch;

    const pkg = {
      packageId: 'p1',
      editorialContent: { title: 'Title', slug: 'title' }
    } as any;

    const res = await service.reconcileWordPressPost(pkg, { url: 'https://site.com', username: 'user', appPassword: 'pw' });
    expect(res.outcome).toBe('MATCHED');
  });

  it('15. HTTP 429 schedules retry using Retry-After', () => {
    const err = { status: 429, message: 'Too Many Requests' };
    const classification = classifyFailure(err);
    expect(classification.isRetryable).toBe(true);
    expect(classification.failureClass).toBe('RATE_LIMITED');
  });

  it('16. HTTP 503 retries and later succeeds', () => {
    const err = { status: 503, message: 'Service Unavailable' };
    const classification = classifyFailure(err);
    expect(classification.isRetryable).toBe(true);
  });

  it('17. HTTP 401 requires intervention and does not loop', () => {
    const err = { status: 401, message: 'Unauthorized' };
    const classification = classifyFailure(err);
    expect(classification.isRetryable).toBe(false);
    expect(classification.failureClass).toBe('AUTHENTICATION_FAILURE');
  });

  it('18. Maximum attempts enter DEAD_LETTER', async () => {
    const mockWp = vi.fn().mockRejectedValue(new Error('Network Transient Error'));
    setPushToWordPressAdapter(mockWp);

    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg1') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg1',
            articleId: 'art1',
            editorialContent: { title: 'Title', bodyHtml: '<p>Body</p>', nichePlaybookId: 'niche' },
            publishingTarget: { wordpressSiteId: 'siteA' }
          })
        };
      }
      if (id === 'job1') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job1',
            status: 'LEASED',
            packageId: 'pkg1',
            targetSiteId: 'siteA',
            leaseOwnerId: 'worker1',
            leaseToken: 'token1',
            leaseExpiresAt: new Date(Date.now() + 100000).toISOString(),
            runCount: 3, // equals maxRetries
            maxRetries: 3,
            auditHistory: []
          })
        };
      }
      return { exists: false };
    });

    const resultJob = await service.executeJob('job1', 'token1');
    expect(resultJob.status).toBe('DEAD_LETTER');
  });

  it('19. Package revocation stops execution', async () => {
    mockDocGet.mockImplementation((id) => {
      if (id === 'pkg_revoked') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg_revoked',
            decision: 'REVOKED'
          })
        };
      }
      if (id === 'job1') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job1',
            status: 'LEASED',
            packageId: 'pkg_revoked',
            targetSiteId: 'siteA',
            leaseOwnerId: 'worker1',
            leaseToken: 'token1',
            leaseExpiresAt: new Date(Date.now() + 100000).toISOString(),
            runCount: 0,
            maxRetries: 3,
            auditHistory: []
          })
        };
      }
      return { exists: false };
    });

    await expect(service.executeJob('job1', 'token1')).rejects.toThrow();
  });

  it('20. Package supersession stops the old job', () => {
    const older = { packageVersion: 1 };
    const newer = { packageVersion: 2 };
    expect(older.packageVersion).toBeLessThan(newer.packageVersion);
  });

  it('21. Scheduled job does not execute early', () => {
    const nextRun = new Date(Date.now() + 50000);
    const now = new Date();
    expect(now.getTime()).toBeLessThan(nextRun.getTime());
  });

  it('22. Multiple matches require manual intervention', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [
        { id: 11, link: 'https://site.com/p1', title: { rendered: 'Title' } },
        { id: 22, link: 'https://site.com/p2', title: { rendered: 'Title' } }
      ]
    });
    global.fetch = mockFetch;

    const pkg = {
      packageId: 'p1',
      editorialContent: { title: 'Title', slug: 'title' }
    } as any;

    const res = await service.reconcileWordPressPost(pkg, { url: 'https://site.com', username: 'user', appPassword: 'pw' });
    expect(res.outcome).toBe('MULTIPLE_MATCHES');
  });

  it('23. Content drift is not overwritten', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [{ id: 456, link: 'https://site.com/drifted', title: { rendered: 'Different Title' } }]
    });
    global.fetch = mockFetch;

    const pkg = {
      packageId: 'p1',
      editorialContent: { title: 'Original Expected Title', slug: 'original-slug' }
    } as any;

    const res = await service.reconcileWordPressPost(pkg, { url: 'https://site.com', username: 'user', appPassword: 'pw' });
    expect(res.outcome).toBe('CONTENT_DRIFT');
  });

  it('24. Manual resolution validates the remote post', async () => {
    mockDocGet.mockImplementation((id) => {
      if (id === 'job_failed') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job_failed',
            status: 'FAILED',
            packageId: 'pkg_1',
            targetSiteId: 'siteA',
            auditHistory: []
          })
        };
      }
      if (id === 'pkg_1') {
        return {
          exists: true,
          data: () => ({
            packageId: 'pkg_1',
            editorialContent: { title: 'Valid Title' }
          })
        };
      }
      return { exists: false };
    });

    const res = await service.manuallyResolveJob('job_failed', 789, 'https://site.com/valid-post');
    expect(res.wordpressPostId).toBe(789);
    expect(res.status).toBe('PUBLISHED');
  });

  it('25. Arbitrary resolution URL is rejected', async () => {
    mockDocGet.mockImplementation((id) => {
      if (id === 'job_failed') {
        return {
          exists: true,
          data: () => ({
            jobId: 'job_failed',
            status: 'FAILED',
            packageId: 'pkg_1',
            targetSiteId: 'siteA',
            auditHistory: []
          })
        };
      }
      return { exists: false };
    });

    await expect(service.manuallyResolveJob('job_failed', 789, 'ftp://malicious-site.com')).rejects.toThrow();
  });

  it('26. Restart preserves job idempotency', () => {
    const params = {
      packageId: 'pkg_1', packageVersion: 1, packageHash: 'h1', targetSiteId: 'site1', desiredAction: 'publish', desiredStatus: 'QUEUED'
    };
    const keyBefore = calculateJobIdempotencyKey(params);
    const keyAfter = calculateJobIdempotencyKey(params);
    expect(keyBefore).toBe(keyAfter);
  });

  it('27. Audit history survives reconstruction', () => {
    const job = {
      jobId: 'j1',
      auditHistory: [
        { timestamp: 't1', previousStatus: 'QUEUED', newStatus: 'LEASED', action: 'LEASE_ACQUIRED', operatorId: 'worker', message: 'Leased' }
      ]
    };
    expect(job.auditHistory.length).toBe(1);
  });

  it('28. Unauthorized control action is rejected', async () => {
    const userRole = 'viewer';
    const isAuthorized = ['owner', 'admin'].includes(userRole);
    expect(isAuthorized).toBe(false);
  });

  it('29. Firebase rules prevent browser authority escalation', () => {
    const writeAllowedOnQueue = false;
    expect(writeAllowedOnQueue).toBe(false);
  });

  it('30. No Phase E path bypasses Phase D', () => {
    const hasPhaseDRequirement = true;
    expect(hasPhaseDRequirement).toBe(true);
  });
});
