import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhaseDOrchestrator } from '../phaseDOrchestrator';
import { generateHash, generateApprovedEditorialHash, sanitizeHtml } from '../finalArticlePackageService';
import { PhaseDInputContract } from '../typesPhaseD';
import { InMemoryPhaseDPackageRepository } from '../phaseDPackageRepository';

describe('Phase D - Unit Tests', () => {
    
    const validBaseInput: PhaseDInputContract = {
        articleId: "a1",
        workflowRunId: "w1",
        articleVersionId: "v1",
        approvedTitle: "Test Title",
        approvedBodyHtml: "<p>Test Content</p>",
        approvedHeadings: ["H1"],
        nichePlaybookId: "TECH",
        editorialVoiceProfileId: "VOICE1",
        phaseCTerminalState: "PASSED",
        phaseCQualityResult: { passed: true, blockingFailures: [] },
        sourcePolicyResult: true,
        verifiedSourceRecords: [],
        citationRecords: [],
        factualVerificationResult: true,
        originalityResult: true,
        naturalnessResult: true,
        writerVoiceResult: true,
        targetWordpressSiteId: "site1",
        categoryMappings: ["1"],
        tagMappings: ["2"],
        authorMappingId: "1"
    };

    beforeEach(() => {
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(process.cwd(), "phase_d_packages.json");
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
    });

    it('1 & 22. Valid Phase C result creates a final package and returns APPROVED_FOR_PUBLISHING', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { decision, pkg } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(decision).toBe("APPROVED_FOR_PUBLISHING");
        expect(pkg).toBeDefined();
        expect(pkg?.articleId).toBe("a1");
    });

    it('Test', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        // Missing articleId and other fields
        const invalidInput = { approvedTitle: "Missing stuff" };
        const { decision, error } = await orchestrator.executePhaseD(invalidInput as any, "hash");
        expect(decision).toBe("TECHNICAL_FAILURE");
        expect(error).toContain("Input validation failed");
    });

    it('3. Non-PASSED Phase C state is rejected (MANUAL_REVIEW_REQUIRED)', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const input = { ...validBaseInput, phaseCTerminalState: "NEEDS_MANUAL_REVIEW" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { pkg } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(pkg).toBeDefined();
        if (pkg) {
            expect(() => { (pkg as any).articleId = "mutated"; }).toThrow();
            expect(() => { (pkg as any).editorialContent.title = "mutated"; }).toThrow();
            expect(() => { (pkg as any).publishingTarget.mappedCategoryIds.push("mutated"); }).toThrow();
            expect(() => { (pkg as any).sourcesAndVerification.citations.push("mutated"); }).toThrow();
        }
    });

    it('5. Audit records sanitize sensitive keys', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const input = { ...validBaseInput, phaseCTerminalState: "PASSED", approvedBodyHtml: "<p>body</p>" };
        
        // Let's pass some reason that has an API key. 
        // We can test this by calling createAuditLog directly.
        const { createAuditLog } = await import("../phaseDAuditService");
        const log = createAuditLog("a1", "w1", "TEST", "TEST_EVENT", "BLOCKED", ["Failed because password=supersecret, apiKey: 12345, token='abc'"]);
        expect(log.sanitizedEvidence).toContain("password=[REDACTED]");
        expect(log.sanitizedEvidence).toContain("apiKey=[REDACTED]");
        expect(log.sanitizedEvidence).toContain("token=[REDACTED]");
        expect(log.sanitizedEvidence).not.toContain("supersecret");
        expect(log.sanitizedEvidence).not.toContain("12345");
        expect(log.sanitizedEvidence).not.toContain("abc");
    });
    it('4b. Content hash mismatch is detected (MANUAL_REVIEW_REQUIRED)', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const hash = generateApprovedEditorialHash(validBaseInput, "<p>Different</p>");
        const { decision } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const r1 = await orchestrator.executePhaseD(validBaseInput, hash);
        const r2 = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(r1.pkg?.packageId).toBe(r2.pkg?.packageId); // Should return same package
    });

    it('Test', async () => {
        const { sanitized } = sanitizeHtml("<p>Text<script>alert(1)</script></p>");
        expect(sanitized).toBe("<p>Text</p>");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, approvedBodyHtml: "<p>Text<script>alert(1)</script></p>" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, approvedTitle: "" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, approvedBodyHtml: "" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, sourcePolicyResult: false };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, phaseCQualityResult: { blockingFailures: ["Fabricated experience/quotation detected."] } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, originalityResult: false };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("BLOCKED");
    });

    it('15. Failed naturalness follows configured policy (MANUAL_REVIEW_REQUIRED)', async () => {
        const input = { ...validBaseInput, naturalnessResult: false };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, authorMappingId: "INVALID" };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, categoryMappings: ["INVALID"] };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const input = { ...validBaseInput, schedulingRequest: { desiredPublishTime: "2020-01-01T00:00:00Z" } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("MANUAL_REVIEW_REQUIRED");
    });

    it('Test', async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const input = { ...validBaseInput, schedulingRequest: { desiredPublishTime: futureDate } };
        const hash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const { decision, wpPayload } = await orchestrator.executePhaseD(input, hash);
        expect(decision).toBe("SCHEDULED");
        expect(wpPayload?.status).toBe("future");
    });

    it('Test', async () => {
        const orchestrator = new PhaseDOrchestrator(new InMemoryPhaseDPackageRepository());
        const hash = generateApprovedEditorialHash(validBaseInput, validBaseInput.approvedBodyHtml);
        const { wpPayload } = await orchestrator.executePhaseD(validBaseInput, hash);
        expect(wpPayload).toBeDefined();
        expect(wpPayload?.title).toBe("Test Title");
        expect(wpPayload?.content).toBe("<p>Test Content</p>");
        expect((wpPayload as any).credentials).toBeUndefined(); // Ensure no credentials
    });
});
