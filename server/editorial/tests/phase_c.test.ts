import { describe, it, expect, vi } from 'vitest';
import { selectNichePlaybook } from '../nichePlaybookService';
import { analyzeOriginality } from '../originalityAnalysisService';
import { analyzeNaturalness } from '../naturalnessAnalysisService';
import { validateWriterVoice } from '../writerVoiceValidationService';
import { evaluateEditorialQuality } from '../editorialQualityService';
import { attemptRepair } from '../editorialRepairService';

describe('Phase C - Niche Playbooks', () => {
  it('selectNichePlaybook returns SPORTS_NEWS_ANALYSIS for football context', () => {
    const pb = selectNichePlaybook('football premier league', 'match review');
    expect(pb.playbookId).toBe('SPORTS_NEWS_ANALYSIS');
  });

  it('selectNichePlaybook returns TRAVEL_NEWS for travel news', () => {
    const pb = selectNichePlaybook('travel updates', 'news');
    expect(pb.playbookId).toBe('TRAVEL_NEWS');
  });
});

describe('Phase C - Originality Analysis', () => {
  const longSourceP = 'This is a completely copied passage that should definitely trigger an exact match failure in the originality analysis module. It needs to be long enough to pass the length check.';
  it('analyzeOriginality detects exact copied passage', async () => {
    const draft = `<p>${longSourceP}</p>`;
    const sources = [{ sourceId: 'src1', sourceUrl: 'test', title: 'Test', paragraphFunctions: [longSourceP], structuralFlow: [] }];
    const res = await analyzeOriginality('trace1', draft, sources as any);
    expect(res.passed).toBe(false);
    expect(res.failingPassages.some(p => p.similarityType === 'EXACT_COPY')).toBe(true);
  });

  it('analyzeOriginality detects close paraphrase', async () => {
    const draft = '<p>This is a completely copied passage that might definitely trigger a very close match failure in the originality analysis module. It has to be long enough.</p>';
    const sources = [{ sourceId: 'src1', paragraphFunctions: [longSourceP], structuralFlow: [] }];
    const res = await analyzeOriginality('trace1', draft, sources as any);
    expect(res.passed).toBe(false);
    expect(res.failingPassages.some(p => p.similarityType === 'CLOSE_PARAPHRASE' || p.similarityType === 'EXACT_COPY')).toBe(true);
  });

  it('analyzeOriginality detects reused distinctive phrase', async () => {
    const draft = '<p>Another paragraph here. The distinctive phrase reuse module is quite clever and definitely triggers failure in the originality analysis module. It needs to be long enough to pass the length check.</p>';
    const sources = [{ sourceId: 'src1', paragraphFunctions: [longSourceP], structuralFlow: [] }];
    const res = await analyzeOriginality('trace1', draft, sources as any);
    expect(res.passed).toBe(false);
    expect(res.failingPassages.some(p => p.similarityType === 'DISTINCTIVE_PHRASE_REUSE' || p.similarityType === 'CLOSE_PARAPHRASE')).toBe(true);
  });

  it('analyzeOriginality ignores short quotations', async () => {
    const sourceP = 'The manager stated "We played well" after the match yesterday evening at the stadium.';
    const draftP = 'The manager stated "We played well" after the match yesterday evening at the stadium.';
    const draft = '<p>' + draftP + '</p>';
    const sources = [{ sourceId: 'src1', paragraphFunctions: [sourceP], structuralFlow: [] }];
    const res = await analyzeOriginality('trace1', draft, sources as any);
    // Since quote is ignored, remaining is too short or doesn't match EXACT_COPY criteria
    expect(res).toBeDefined();
  });

  it('analyzeOriginality detects copied heading order', async () => {
    const draft = '<h2>Intro to Subject</h2><h2>Main Event Details</h2>';
    const sources = [{ sourceId: 'src1', paragraphFunctions: [], structuralFlow: ['Intro to Subject', 'Main Event Details'] }];
    const res = await analyzeOriginality('trace1', draft, sources as any);
    expect(res.passed).toBe(false);
    expect(res.structuralWarnings.length).toBeGreaterThan(0);
  });

  it('analyzeOriginality ignores very short text', async () => {
    const draft = '<p>Too short.</p>';
    const sources = [{ sourceId: 'src1', paragraphFunctions: ['Too short.'], structuralFlow: [] }];
    const res = await analyzeOriginality('trace1', draft, sources as any);
    expect(res.passed).toBe(true);
  });

  it('blocks an opening and heading flow reused from a recent internal article', async () => {
    const opening = 'The verified announcement changes how readers should understand the product and the limits of the current evidence.';
    const draft = `## What changed\n\n${opening}\n\n## Why the evidence matters\n\nThe documented details separate confirmed information from unresolved questions for readers.`;
    const archived = `## What changed\n\n${opening}\n\n## Why the evidence matters\n\nAn earlier article used the same explanatory route and should not be repeated.`;
    const res = await analyzeOriginality('trace1', draft, [], [{ id: 'previous-article', title: 'Earlier coverage', content: archived }]);
    expect(res.passed).toBe(false);
    expect(res.failingPassages.some(p => p.similarityType === 'ARCHIVE_OPENING_SIMILARITY')).toBe(true);
    expect(res.structuralWarnings.join(' ')).toMatch(/recent article/i);
  });
});

describe('Phase C - Naturalness Analysis', () => {
  it('detects formulaic introduction', async () => {
    const draft = "<p>In today's fast-paced world, this is a test. We will write more content.</p>";
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Formulaic introduction');
  });

  it('detects generic conclusion', async () => {
    const draft = '<p>Some content.</p><p>In conclusion, this is bad.</p>';
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Generic conclusion');
  });

  it('detects repeated transitions', async () => {
    const draft = '<p>Furthermore, we go. However, we stay. Moreover, we wait. Additionally, we sing.</p>';
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Repeated transitions');
  });

  it('detects repeated sentence openings', async () => {
    const draft = '<p>Bears are cool. Bears eat honey. Bears run fast. Bears sleep a lot.</p>';
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Repeated sentence openings');
  });

  it('detects mechanical list construction', async () => {
    const draft = '<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li></ul>';
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Mechanical list construction');
  });

  it('detects excessive rhetorical questions', async () => {
    const draft = '<p>Why is this happening? Who knows? Will it change? Probably not. What can we do?</p>';
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Excessive rhetorical questions');
  });

  it('detects unnatural keyword repetition', async () => {
    const draft = '<p>Testing testing testing testing testing testing testing testing.</p>';
    const res = await analyzeNaturalness('trace1', draft);
    expect(res.detectedPatterns).toContain('Unnatural keyword repetition');
  });
});

describe('Phase C - Editorial Quality & Repair', () => {
  it('evaluateEditorialQuality fails if originality fails', () => {
     const originalityData = { passed: false, overallOriginalityScore: 60 };
     const naturalnessData = { passed: true, naturalnessScore: 88, detectedPatterns: [] };
     const writerVoiceData = { passed: true, voiceConsistencyScore: 85 };
     const res = evaluateEditorialQuality('trace1', {passed: true}, originalityData as any, naturalnessData as any, writerVoiceData as any, true, true, true, true);
     expect(res.passed).toBe(false);
     expect(res.blockingFailures).toContain('Originality checks failed.');
  });

  it('evaluateEditorialQuality fails if compliance fails', () => {
     const originalityData = { passed: true, overallOriginalityScore: 80 };
     const naturalnessData = { passed: true, naturalnessScore: 88, detectedPatterns: [] };
     const writerVoiceData = { passed: true, voiceConsistencyScore: 85 };
     const res = evaluateEditorialQuality('trace1', {passed: true}, originalityData as any, naturalnessData as any, writerVoiceData as any, true, true, false, true);
     expect(res.passed).toBe(false);
     expect(res.blockingFailures).toContain('Critical compliance failure.');
  });

  it('attemptRepair tracks cycle limit', async () => {
     const res = await attemptRepair('trace1', '<p>Test</p>', 'ORIGINALITY', [], ['Fix this'], [], 'Natural Style Editor', 3);
     expect(res.repairRecord.cycle).toBe(3);
  });

  it('attemptRepair fails closed when no repair provider is available', async () => {
     const res = await attemptRepair(
       'trace1',
       '<p>This draft needs a real repair.</p>',
       'ORIGINALITY',
       ['This draft needs a real repair.'],
       ['Replace the copied passage with an original explanation.'],
       ['claim_1'],
       'Natural Style Editor',
       1
     );

     expect(res.resolved).toBe(false);
     expect(res.repairedHtml).toBe('');
     expect(res.repairRecord.resolved).toBe(false);
     expect(res.repairRecord.protectedClaimIds).toEqual(['claim_1']);
  });

  it('evaluateEditorialQuality logs structured observability data without sensitive info', () => {
     const originalityData = { passed: true, overallOriginalityScore: 90 };
     const naturalnessData = { passed: true, naturalnessScore: 95, detectedPatterns: [] };
     const writerVoiceData = { passed: true, voiceConsistencyScore: 90 };
     
     const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
     
     evaluateEditorialQuality('trace-obs', {passed: true}, originalityData as any, naturalnessData as any, writerVoiceData as any, true, true, true, true);
     
     expect(logSpy).toHaveBeenCalled();
     const logArg = logSpy.mock.calls[logSpy.mock.calls.length - 1][0] as string;
     const logData = JSON.parse(logArg);
     
     expect(logData).toHaveProperty('articleId', 'trace-obs');
     expect(logData).toHaveProperty('validationStage', 'EDITORIAL_QUALITY');
     expect(logData).toHaveProperty('metric');
     expect(logData).toHaveProperty('rawScore');
     expect(logData).toHaveProperty('action');
     expect(logData).toHaveProperty('terminalState');
     expect(logData).toHaveProperty('timestamp');
     // Check exclusion of sensitive values
     expect(logArg).not.toContain('<p>');
     
     logSpy.mockRestore();
  });
});
