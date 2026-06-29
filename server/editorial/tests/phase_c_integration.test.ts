import { describe, it, expect, vi } from 'vitest';
import { analyzeOriginality } from '../originalityAnalysisService';
import { analyzeNaturalness } from '../naturalnessAnalysisService';
import { evaluateEditorialQuality } from '../editorialQualityService';
import { validateWriterVoice } from '../writerVoiceValidationService';
import { attemptRepair } from '../editorialRepairService';
import { selectNichePlaybook } from '../nichePlaybookService';

// Mock LLM repair for testing
vi.mock('../editorialRepairService', async () => {
    const original = await vi.importActual<any>('../editorialRepairService');
    return {
        ...original,
        attemptRepair: vi.fn(async (traceId, currentHtml, failureType, passages, instructions, claims, agent, cycle) => {
            if (currentHtml.includes('FAIL_REPAIR_EXCEPTION')) throw new Error("Repair service exception");
            if (currentHtml.includes('EMPTY_REPAIR_OUTPUT')) return { resolved: true, repairedHtml: "", repairRecord: { cycle } };
            if (currentHtml.includes('DAMAGE_ORIGINALITY')) return { resolved: true, repairedHtml: "<p>This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.</p>", repairRecord: { cycle } };
            
            // Default successful repair
            return { resolved: true, repairedHtml: "<p>This is the repaired original text that passes all checks smoothly.</p>", repairRecord: { cycle } };
        })
    };
});

describe('Phase C - Integration & Composition', () => {

    const runOrchestrator = async (draftHtml: string, sourceHtml: string, isFresh: boolean = true, compliancePassed: boolean = true, maxRepairs: number = 2) => {
        let currentHtml = draftHtml;
        let repairAttempts = 0;
        let finalQuality: any = null;
        let passedCompliance = false;
        const deconstructions = [{ sourceId: 'src1', sourceUrl: 'test', title: 'Test', paragraphFunctions: [sourceHtml], structuralFlow: [] }];

        while (repairAttempts <= maxRepairs) {
            const originalityData = await analyzeOriginality('trace1', currentHtml, deconstructions as any);
            const naturalnessData = await analyzeNaturalness('trace1', currentHtml);
            const writerVoiceData = await validateWriterVoice('trace1', currentHtml, { style: 'Standard' });
            
            finalQuality = evaluateEditorialQuality(
                'trace1',
                { passed: true, unsupportedPassages: [] },
                originalityData,
                naturalnessData,
                writerVoiceData,
                true, // playbookPassed
                isFresh,
                compliancePassed,
                true  // noFabrication
            );

            let needsRepair = false;
            let repairNotes = [];
            
            if (originalityData.overallOriginalityScore < 75) { needsRepair = true; repairNotes.push("Originality low"); }
            if (naturalnessData.aiMarkersDetected > 5) { needsRepair = true; repairNotes.push("AI markers high"); }
            if (writerVoiceData.voiceConsistencyScore < 80) { needsRepair = true; repairNotes.push("Voice low"); }
            if (!finalQuality.passed) { needsRepair = true; repairNotes.push("Quality gates failed"); }
            
            if (needsRepair && repairAttempts < maxRepairs) {
                repairAttempts++;
                try {
                    const repairResult = await attemptRepair('trace1', currentHtml, "General", [], repairNotes, [], "System", repairAttempts);
                    if (!repairResult.repairedHtml || repairResult.repairedHtml.trim() === "") {
                        break; // empty repair output cannot proceed
                    }
                    currentHtml = repairResult.repairedHtml;
                } catch(e) {
                    break; // provider exception
                }
            } else {
                passedCompliance = (!needsRepair);
                break;
            }
        }
        
        return { passedCompliance, finalQuality, currentHtml, repairAttempts, terminalState: passedCompliance ? "PASSED" : "NEEDS_MANUAL_REVIEW" };
    };

    it('1. A valid original and natural draft passes Phase C', async () => {
        const res = await runOrchestrator('<p>This is a completely unique and highly engaging draft that does not match the source.</p>', '<p>The source is different.</p>');
        expect(res.passedCompliance).toBe(true);
        expect(res.terminalState).toBe("PASSED");
    });

    it('2. An exact copied draft is blocked or repaired', async () => {
        const sourceP = "This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.";
        const res = await runOrchestrator('<p>' + sourceP + '</p>', sourceP);
        expect(res.passedCompliance).toBe(true); // Repaired!
        expect(res.repairAttempts).toBe(1);
        expect(res.currentHtml).toContain("repaired original text"); // Mock repair fixes it
    });

    it('4. A high overall score cannot override failed originality', async () => {
        const originalityData = { passed: false, overallOriginalityScore: 20 } as any;
        const naturalnessData = { passed: true, naturalnessScore: 100, detectedPatterns: [] } as any;
        const writerVoiceData = { passed: true, voiceConsistencyScore: 100 } as any;
        const res = evaluateEditorialQuality('trace1', {passed: true}, originalityData, naturalnessData, writerVoiceData, true, true, true, true);
        // Total score might be >85, but passed must be false
        expect(res.totalScore).toBeGreaterThan(80);
        expect(res.passed).toBe(false);
        expect(res.blockingFailures).toContain("Originality checks failed.");
    });

    it('5. A high overall score cannot override failed compliance', async () => {
        const originalityData = { passed: true, overallOriginalityScore: 100 } as any;
        const naturalnessData = { passed: true, naturalnessScore: 100, detectedPatterns: [] } as any;
        const writerVoiceData = { passed: true, voiceConsistencyScore: 100 } as any;
        const res = evaluateEditorialQuality('trace1', {passed: true}, originalityData, naturalnessData, writerVoiceData, true, true, false, true); // compliancePassed = false
        expect(res.passed).toBe(false);
        expect(res.blockingFailures).toContain("Critical compliance failure.");
    });

    it('8. Maximum repair attempts produce NEEDS_MANUAL_REVIEW', async () => {
        const sourceP = "This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.";
        // Set max repairs to 0 to simulate exhaustion immediately
        const res = await runOrchestrator('<p>' + sourceP + '</p>', sourceP, true, true, 0);
        expect(res.passedCompliance).toBe(false);
        expect(res.terminalState).toBe("NEEDS_MANUAL_REVIEW");
    });

    it('9. Empty repair output cannot proceed to publishing', async () => {
        const res = await runOrchestrator('<p>EMPTY_REPAIR_OUTPUT</p><p>This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.</p>', 'This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.');
        expect(res.passedCompliance).toBe(false);
        expect(res.terminalState).toBe("NEEDS_MANUAL_REVIEW");
    });

    it('10. A repair service exception cannot proceed to publishing', async () => {
        const res = await runOrchestrator('<p>FAIL_REPAIR_EXCEPTION</p><p>This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.</p>', 'This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.');
        expect(res.passedCompliance).toBe(false);
        expect(res.terminalState).toBe("NEEDS_MANUAL_REVIEW");
    });

    it('11. Naturalness repair that damages originality is rejected', async () => {
        // Trigger repair, mock returns DAMAGE_ORIGINALITY text
        const res = await runOrchestrator('<p>DAMAGE_ORIGINALITY</p><p>This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.</p>', 'This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.', true, true, 1);
        expect(res.passedCompliance).toBe(false);
        expect(res.terminalState).toBe("NEEDS_MANUAL_REVIEW");
    });

    it('12. A valid football article uses SPORTS_NEWS_ANALYSIS without invoking unrelated functionality', () => {
        const playbook = selectNichePlaybook('football premier league', 'match recap');
        expect(playbook.playbookId).toBe('SPORTS_NEWS_ANALYSIS');
    });
});
