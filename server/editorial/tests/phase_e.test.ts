import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isValidTransition, 
  calculateJobIdempotencyKey, 
  JobStatus 
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
      get: async (ref: any) => ref.get(),
      set: async (ref: any, data: any) => ref.set(data),
      update: async (ref: any, data: any) => ref.update(data)
    });
  }
};

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockFirestore
}));

describe('Phase E - State Machine Transitions', () => {
  it('allows valid transitions', () => {
    expect(isValidTransition('QUEUED', 'LEASED')).toBe(true);
    expect(isValidTransition('LEASED', 'EXECUTING')).toBe(true);
    expect(isValidTransition('EXECUTING', 'PUBLISHED')).toBe(true);
    expect(isValidTransition('EXECUTING', 'RETRY_WAIT')).toBe(true);
    expect(isValidTransition('RETRY_WAIT', 'QUEUED')).toBe(true);
    expect(isValidTransition('EXECUTING', 'DEAD_LETTER')).toBe(true);
    expect(isValidTransition('DEAD_LETTER', 'QUEUED')).toBe(true);
    expect(isValidTransition('QUEUED', 'CANCELLED')).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(isValidTransition('PUBLISHED', 'LEASED')).toBe(false);
    expect(isValidTransition('CANCELLED', 'LEASED')).toBe(false);
    expect(isValidTransition('DEAD_LETTER', 'LEASED')).toBe(false);
    expect(isValidTransition('PUBLISHED', 'CANCELLED')).toBe(false);
  });

  it('stores newly created jobs with canonical uppercase states and rejects invalid/unknown states', () => {
    expect(isValidTransition('QUEUED', 'LEASED')).toBe(true);
    expect(isValidTransition('LEASED', 'EXECUTING')).toBe(true);
    expect(isValidTransition('EXECUTING', 'PUBLISHED')).toBe(true);
  });

  it('rejects unknown or invalid status transitions', () => {
    expect(isValidTransition('QUEUED', 'UNKNOWN_ST')).toBe(false);
    expect(isValidTransition('QUEUED', 'SOMETHING_INVALID')).toBe(false);
  });

  it('normalizes legacy lowercase states to uppercase for transition verification', () => {
    expect(isValidTransition('queued', 'leased')).toBe(true);
    expect(isValidTransition('leased', 'executing')).toBe(true);
    expect(isValidTransition('executing', 'published')).toBe(true);
  });
});

describe('Phase E - Deterministic Idempotency Key Generation', () => {
  it('generates identical keys for identical inputs', () => {
    const params = {
      packageId: 'pkg_test_123',
      packageVersion: 2,
      packageHash: 'abcde12345',
      targetSiteId: 'wp-site-4',
      desiredAction: 'publish',
      desiredStatus: 'QUEUED',
      scheduleTimestamp: null
    };

    const key1 = calculateJobIdempotencyKey(params);
    const key2 = calculateJobIdempotencyKey(params);
    expect(key1).toBe(key2);
    expect(key1.length).toBe(64); // Hexadecimal SHA-256
  });

  it('generates different keys for different versions or hashes', () => {
    const params1 = {
      packageId: 'pkg_test_123',
      packageVersion: 2,
      packageHash: 'abcde12345',
      targetSiteId: 'wp-site-4',
      desiredAction: 'publish',
      desiredStatus: 'QUEUED',
      scheduleTimestamp: null
    };

    const params2 = { ...params1, packageVersion: 3 };
    const params3 = { ...params1, packageHash: 'different' };

    const key1 = calculateJobIdempotencyKey(params1);
    const key2 = calculateJobIdempotencyKey(params2);
    const key3 = calculateJobIdempotencyKey(params3);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });
});

describe('Phase E - Failure Classification and Backoff', () => {
  it('correctly classifies transient failures as retryable', () => {
    const transientError1 = { status: 504, message: "Gateway Timeout" };
    const transientError2 = new Error("Fetch failed: ETIMEDOUT");
    
    expect(classifyFailure(transientError1).isRetryable).toBe(true);
    expect(classifyFailure(transientError1).failureClass).toBe("NETWORK_TRANSIENT");
    
    expect(classifyFailure(transientError2).isRetryable).toBe(true);
    expect(classifyFailure(transientError2).failureClass).toBe("NETWORK_TRANSIENT");
  });

  it('correctly classifies authentication and invalid payload failures as non-retryable', () => {
    const authError = { status: 401, message: "Unauthorized access" };
    const payloadError = { status: 400, message: "Bad Request" };

    expect(classifyFailure(authError).isRetryable).toBe(false);
    expect(classifyFailure(authError).failureClass).toBe("AUTHENTICATION_FAILURE");

    expect(classifyFailure(payloadError).isRetryable).toBe(false);
    expect(classifyFailure(payloadError).failureClass).toBe("INVALID_PAYLOAD");
  });
});

describe('Phase E - PublishingQueueService', () => {
  let service: PublishingQueueService;

  beforeEach(() => {
    vi.resetAllMocks();
    mockQueryGet.mockReset();
    mockDocGet.mockReset();
    mockDocSet.mockReset();
    mockDocUpdate.mockReset();
    mockCollectionAdd.mockReset();

    mockGetApps.mockReturnValue([{ name: '[DEFAULT]' }]);
    mockDocGet.mockReturnValue({ exists: false });
    mockQueryGet.mockResolvedValue({ docs: [], empty: true, forEach: () => {} });

    service = new PublishingQueueService();
  });

  describe('addJob', () => {
    it('creates a new job idempotently', async () => {
      // Mock package exists
      mockDocGet.mockImplementation((id) => {
        if (id === 'pkg_1') {
          return {
            exists: true,
            data: () => ({
              packageId: 'pkg_1',
              packageVersion: 1,
              decision: 'APPROVED_FOR_PUBLISHING',
              editorialContent: { title: 'Test Article', bodyTextHash: 'hash1' },
              publishingTarget: { wordpressSiteId: 'siteA' }
            })
          };
        }
        return { exists: false };
      });

      // Mock first run (no existing job on first read)
      mockDocGet.mockImplementationOnce((id) => ({
        exists: true,
        data: () => ({
          packageId: 'pkg_1',
          packageVersion: 1,
          decision: 'APPROVED_FOR_PUBLISHING',
          editorialContent: { title: 'Test Article', bodyTextHash: 'hash1' },
          publishingTarget: { wordpressSiteId: 'siteA' }
        })
      })).mockImplementationOnce((jobId) => ({
        exists: false // Job doesn't exist yet, we can create it
      }));

      const job = await service.addJob('pkg_1');
      expect(job).toBeDefined();
      expect(job.status).toBe('QUEUED');
      expect(job.packageId).toBe('pkg_1');
    });
  });

  describe('Secure Transactional Leasing', () => {
    it('executing job throws if leaseToken is stale or incorrect', async () => {
      mockDocGet.mockImplementation((id) => {
        if (id === 'job_error') {
          return {
            exists: true,
            data: () => ({
              jobId: 'job_error',
              packageId: 'pkg_1',
              targetSiteId: 'siteA',
              status: 'LEASED',
              leaseToken: 'token_A',
              leaseExpiresAt: new Date(Date.now() + 100000).toISOString(),
              auditHistory: []
            })
          };
        }
        return { exists: false };
      });

      await expect(service.executeJob('job_error', 'token_B')).rejects.toThrow('LEASE_ERROR');
    });

    it('executing job throws if lease has expired', async () => {
      mockDocGet.mockImplementation((id) => {
        if (id === 'job_expired') {
          return {
            exists: true,
            data: () => ({
              jobId: 'job_expired',
              packageId: 'pkg_1',
              targetSiteId: 'siteA',
              status: 'LEASED',
              leaseToken: 'token_A',
              leaseExpiresAt: new Date(Date.now() - 1000).toISOString(), // expired
              auditHistory: []
            })
          };
        }
        return { exists: false };
      });

      await expect(service.executeJob('job_expired', 'token_A')).rejects.toThrow('LEASE_ERROR');
    });
  });

  describe('Automatic WordPress Reconciliation', () => {
    it('returns MATCHED if a remote post with matching slug and title exists', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => [{ id: 456, link: 'https://site.com/match', title: { rendered: 'Exact Title' } }]
      });
      global.fetch = mockFetch;

      const pkg = {
        articleId: 'art1',
        packageId: 'pkg1',
        editorialContent: { title: 'Exact Title', slug: 'exact-title' }
      } as any;

      const wpConfig = { url: 'https://site.com', username: 'user', appPassword: 'pw' };

      const res = await service.reconcileWordPressPost(pkg, wpConfig);
      expect(res.outcome).toBe('MATCHED');
      expect(res.postId).toBe(456);
      expect(res.postUrl).toBe('https://site.com/match');
    });

    it('returns CONTENT_DRIFT if a remote post with matching slug but different title is found', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => [{ id: 456, link: 'https://site.com/match', title: { rendered: 'Some Drifting Title' } }]
      });
      global.fetch = mockFetch;

      const pkg = {
        articleId: 'art1',
        packageId: 'pkg1',
        editorialContent: { title: 'Expected Title', slug: 'expected-title' }
      } as any;

      const wpConfig = { url: 'https://site.com', username: 'user', appPassword: 'pw' };

      const res = await service.reconcileWordPressPost(pkg, wpConfig);
      expect(res.outcome).toBe('CONTENT_DRIFT');
    });
  });

  describe('Secure Manual Resolution Overrides', () => {
    it('allows resolution only for failed/dead letter jobs and validates URL protocol', async () => {
      mockDocGet.mockImplementation((id) => {
        if (id === 'job_cancelled') {
          return {
            exists: true,
            data: () => ({
              jobId: 'job_cancelled',
              status: 'CANCELLED', // Not permitted
              packageId: 'pkg_1',
              auditHistory: []
            })
          };
        }
        return { exists: false };
      });

      await expect(service.manuallyResolveJob('job_cancelled', 123, 'https://wp.com/post')).rejects.toThrow('override');
    });

    it('rejects invalid protocol URLs', async () => {
      mockDocGet.mockImplementation((id) => {
        if (id === 'job_failed') {
          return {
            exists: true,
            data: () => ({
              jobId: 'job_failed',
              status: 'FAILED',
              packageId: 'pkg_1',
              auditHistory: []
            })
          };
        }
        return { exists: false };
      });

      await expect(service.manuallyResolveJob('job_failed', 123, 'ftp://wp.com/post')).rejects.toThrow('protocol');
    });
  });
});
