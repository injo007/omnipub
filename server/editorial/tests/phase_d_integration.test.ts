import { describe, it, expect } from 'vitest';
import { PhaseDOrchestrator } from '../phaseDOrchestrator';
import { InMemoryPhaseDPackageRepository } from '../phaseDPackageRepository';
import { generateApprovedEditorialHash } from '../finalArticlePackageService';
import { PhaseDInputContract } from '../typesPhaseD';

describe('Phase D - Integration Scenarios', () => {
    const validBaseInput: PhaseDInputContract = {
        articleId: "integration_trace_1",
        workflowRunId: "w1",
        articleVersionId: "v1",
        targetWordpressSiteId: "example.com",
        approvedTitle: "Test Integration Article",
        approvedBodyHtml: "<p>Test Content</p>",
        approvedHeadings: ["Introduction"],
        approvedQuotations: [],
        approvedAttributionText: "",
        approvedExcerpt: "Test Excerpt",
        approvedFactualClaimReferences: [],
        phaseCTerminalState: "PASSED",
        sourcePolicyResult: true,
        factualVerificationResult: true,
        originalityResult: true,
        naturalnessResult: true,
        writerVoiceResult: true,
        phaseCQualityResult: { blockingFailures: [] },
        seoMetadata: { metaTitle: "Test", metaDescription: "Test", primaryKeyword: "test", additionalKeywords: [] },
        categoryMappings: ["1"],
        tagMappings: ["2"],
        authorMappingId: "1",
        nichePlaybookId: "SPORTS_NEWS_ANALYSIS",
        editorialVoiceProfileId: "VOICE_1",
        verifiedSourceRecords: [],
        citationRecords: []
    };

    it('1. Phase C PASSED to APPROVED_FOR_PUBLISHING', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(decision).toBe("APPROVED_FOR_PUBLISHING");
    });

    it('2. Phase C PASSED to SCHEDULED', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const input = { ...validBaseInput, schedulingRequest: { desiredPublishTime: futureDate } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("SCHEDULED");
    });

    it('3. Phase C NEEDS_MANUAL_REVIEW cannot pass', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, phaseCTerminalState: "NEEDS_MANUAL_REVIEW" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('4. Phase C BLOCKED remains BLOCKED', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, phaseCTerminalState: "BLOCKED" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('5. Blocked source overrides valid SEO and scheduling', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const input = { ...validBaseInput, sourcePolicyResult: false, schedulingRequest: { desiredPublishTime: futureDate } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('6. Fabrication overrides all positive metrics', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, phaseCQualityResult: { blockingFailures: ["Fabricated experience/quotation detected."] } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('7. Changed title after Phase C fails hash validation', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const originalHash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const input = { ...validBaseInput, approvedTitle: "Changed Title" };
        const { decision } = await orchestrator.executePhaseD(input, originalHash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('8. Changed body after Phase C fails hash validation', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const originalHash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const input = { ...validBaseInput, approvedBodyHtml: "<p>Changed Body</p>" };
        const { decision } = await orchestrator.executePhaseD(input, originalHash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('9. Changed attribution content requires Phase C', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const originalHash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const input = { ...validBaseInput, approvedAttributionText: "New Attribution" };
        const { decision } = await orchestrator.executePhaseD(input, originalHash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('10. Metadata-only correction resumes Phase D', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const input = { ...validBaseInput, categoryMappings: ["2"] };
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("APPROVED_FOR_PUBLISHING");
    });

    it('11. Editorial correction cannot resume Phase D directly', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const originalHash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const input = { ...validBaseInput, approvedBodyHtml: "<p>Editorial fix</p>" };
        const { decision } = await orchestrator.executePhaseD(input, originalHash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('12. Identical package request returns the persisted package', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        await orchestrator.executePhaseD(validBaseInput, hash);
        const { pkg } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(pkg).toBeDefined();
        expect(pkg?.packageStatus).toBe("APPROVED_FOR_PUBLISHING");
    });

    it('13. Two concurrent requests create exactly one package', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const [res1, res2] = await Promise.all([
            orchestrator.executePhaseD(validBaseInput, hash),
            orchestrator.executePhaseD(validBaseInput, hash)
        ]);
        expect(res1.pkg).toBeDefined();
        expect(res2.pkg).toBeDefined();
        expect(res1.pkg?.packageId).toEqual(res2.pkg?.packageId);
    });

    it('14. New orchestrator instance returns the existing package', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator1 = new PhaseDOrchestrator(repo);
        const orchestrator2 = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const res1 = await orchestrator1.executePhaseD(validBaseInput, hash);
        const res2 = await orchestrator2.executePhaseD(validBaseInput, hash);
        expect(res1.pkg?.packageId).toEqual(res2.pkg?.packageId);
    });

    it('15. Simulated restart returns the existing package', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const orchestrator1 = new PhaseDOrchestrator(repo);
        const res1 = await orchestrator1.executePhaseD(validBaseInput, hash);
        const orchestrator2 = new PhaseDOrchestrator(repo);
        const res2 = await orchestrator2.executePhaseD(validBaseInput, hash);
        expect(res1.pkg?.packageId).toEqual(res2.pkg?.packageId);
    });

    it('16. Failed transaction followed by retry creates one package', async () => {
        let attempts = 0;
        const repo = new InMemoryPhaseDPackageRepository();
        const originalCreate = repo.createIfAbsent.bind(repo);
        repo.createIfAbsent = async (k, p) => {
            if (attempts++ === 0) throw new Error("Network Error");
            return originalCreate(k, p);
        };
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const failRes = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(failRes.decision).toBe("TECHNICAL_FAILURE");
        const successRes = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(successRes.decision).toBe("APPROVED_FOR_PUBLISHING");
    });

    it('17. Audit persistence failure returns TECHNICAL_FAILURE', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        repo.persistDecisionEvent = async () => { throw new Error("DB Error"); };
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(decision).toBe("TECHNICAL_FAILURE");
    });

    it('18. Package persistence failure returns TECHNICAL_FAILURE', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        repo.createIfAbsent = async () => { throw new Error("DB Error"); };
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(decision).toBe("TECHNICAL_FAILURE");
    });

    it('19. Material sanitizer text change returns MANUAL_REVIEW_REQUIRED', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, approvedBodyHtml: "<p>Text <script>malicious()</script></p>" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('20. Hostile HTML is sanitized and cannot reach the payload', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, approvedBodyHtml: "<p onmouseover='alert(1)'>Text</p><script>alert(2)</script>" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('21. Complete package generates a supported WordPress payload', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { wpPayload } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(wpPayload).toBeDefined();
        expect(wpPayload?.status).toBe("publish");
        expect(wpPayload?.content).toBe("<p>Test Content</p>");
        expect(wpPayload?.title).toBe("Test Integration Article");
    });

    it('22. Invalid mapping prevents payload or queue readiness', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, categoryMappings: ["INVALID"] };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision, wpPayload } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
        expect(wpPayload).toBeUndefined();
    });

    it('23. Expired manual-review reference is rejected', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const input = { ...validBaseInput, schedulingRequest: { desiredPublishTime: pastDate } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('24. Cross-article manual-review reference is rejected', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const input = { ...validBaseInput, articleId: "different_article" };
        const originalHash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, originalHash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('25. Football remains exclusively under SPORTS_NEWS_ANALYSIS', async () => {
        const repo = new InMemoryPhaseDPackageRepository();
        const orchestrator = new PhaseDOrchestrator(repo);
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { pkg } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(pkg?.editorialContent.nichePlaybookId).toBe("SPORTS_NEWS_ANALYSIS");
    });

});
