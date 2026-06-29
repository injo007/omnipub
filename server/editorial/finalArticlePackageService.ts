import { PhaseDInputContract, FinalArticlePackage, PhaseDDecision } from "./typesPhaseD";
import { evaluateReadiness } from "./publishingReadinessService";
import crypto from "crypto";
import sanitizeHtmlLib from "sanitize-html";

export function generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

export function generateApprovedEditorialHash(input: PhaseDInputContract, bodyHtml: string): string {
    const payload = {
        articleId: input.articleId,
        title: input.approvedTitle,
        bodyHtml,
        headings: input.approvedHeadings || [],
        quotations: input.approvedQuotations || [],
        attributionText: input.approvedAttributionText || "",
        excerpt: input.approvedExcerpt || "",
        factualClaimReferences: input.approvedFactualClaimReferences || []
    };
    return generateHash(JSON.stringify(payload, Object.keys(payload).sort()));
}

export function generateFinalPackageHash(pkg: Partial<FinalArticlePackage>): string {
    const payload = {
        editorialHash: pkg.editorialContent?.bodyTextHash || "",
        seo: pkg.seo || {},
        media: pkg.media || {},
        publishingTarget: pkg.publishingTarget || {},
        versions: pkg.auditAndProvenance?.qualityConfigurationVersion || ""
    };
    return generateHash(JSON.stringify(payload, Object.keys(payload).sort()));
}

export function sanitizeHtml(html: string): { sanitized: string, materiallyChanged: boolean } {
    if (!html) return { sanitized: "", materiallyChanged: false };
    
    const allowedTags = sanitizeHtmlLib.defaults.allowedTags.concat([ 'img', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td' ]);
    
    const sanitized = sanitizeHtmlLib(html, {
        allowedTags: allowedTags,
        allowedAttributes: {
            ...sanitizeHtmlLib.defaults.allowedAttributes,
            'img': ['src', 'alt', 'title', 'width', 'height'],
            'a': ['href', 'title', 'target', 'rel']
        },
        allowedIframeHostnames: [],
        allowProtocolRelative: false,
    });
    
    const originalNorm = html.replace(/\s+/g, ' ').trim();
    const sanNorm = sanitized.replace(/\s+/g, ' ').trim();
    let materiallyChanged = originalNorm !== sanNorm;
    
    return { sanitized, materiallyChanged };
}

export function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj && typeof obj === 'object') {
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach(prop => {
            const propVal = (obj as any)[prop];
            if (propVal !== null &&
                (typeof propVal === 'object' || typeof propVal === 'function') &&
                !Object.isFrozen(propVal)) {
                deepFreeze(propVal);
            }
        });
    }
    return obj;
}

export function buildFinalArticlePackage(
    input: PhaseDInputContract, 
    originalPhaseCHash: string,
    packageVersion: number = 1
): { pkg: FinalArticlePackage | null, decision: PhaseDDecision, reasons: string[] } {
    try {
        if (!input.approvedBodyHtml) {
            // Missing body blocks packaging (test 11)
            return { pkg: null, decision: "BLOCKED", reasons: ["Body is missing"] };
        }

        // 1. Hash Validation
        const currentHash = generateApprovedEditorialHash(input, input.approvedBodyHtml);
        if (currentHash !== originalPhaseCHash) {
            return { pkg: null, decision: "MANUAL_REVIEW_REQUIRED", reasons: ["Content hash mismatch."] };
        }

        // 2. Normalization
        const { sanitized, materiallyChanged } = sanitizeHtml(input.approvedBodyHtml);
        if (materiallyChanged) {
            return { pkg: null, decision: "MANUAL_REVIEW_REQUIRED", reasons: ["Material normalization change."] };
        }

        const sanitizedHash = generateApprovedEditorialHash(input, sanitized);

        // 3. Readiness Evaluation
        const readiness = evaluateReadiness(input, sanitizedHash);
        
        // Even if blocked, we might build the package if we can, but let's build it to record the decision.
        const pkgId = `pkg_${input.articleId}_${Date.now()}`;
        const wordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
        const readingTime = Math.ceil(wordCount / 200);

        const slug = input.approvedTitle ? input.approvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';

        const pkg: FinalArticlePackage = deepFreeze({
            packageId: pkgId,
            articleId: input.articleId,
            workflowRunId: input.workflowRunId,
            packageVersion: packageVersion,
            sourceArticleVersionId: input.articleVersionId,
            createdAt: new Date().toISOString(),
            createdBy: "Phase_D_Assembly",
            packageStatus: readiness.decision,
            
            editorialContent: {
                title: input.approvedTitle,
                slug: slug,
                excerpt: input.approvedExcerpt || "",
                bodyHtml: sanitized,
                bodyTextHash: sanitizedHash,
                headings: input.approvedHeadings,
                nichePlaybookId: input.nichePlaybookId,
                editorialVoiceProfileId: input.editorialVoiceProfileId,
                language: "en",
                wordCount: wordCount,
                readingTime: readingTime
            },

            seo: input.seoMetadata || {},
            
            sourcesAndVerification: {
                normalizedSourceReferences: input.verifiedSourceRecords || [],
                citations: input.citationRecords || [],
                attributionRecords: [],
                sourcePolicyDecision: input.sourcePolicyResult,
                factualVerificationSnapshot: input.factualVerificationResult,
                originalitySnapshot: input.originalityResult,
                naturalnessSnapshot: input.naturalnessResult,
                voiceValidationSnapshot: input.writerVoiceResult,
                completePhaseCQualitySnapshot: input.phaseCQualityResult
            },

            media: input.mediaPackage || {},

            publishingTarget: {
                wordpressSiteId: input.targetWordpressSiteId,
                endpointReference: `https://${input.targetWordpressSiteId}/wp-json/wp/v2/posts`,
                mappedAuthorId: input.authorMappingId,
                mappedCategoryIds: input.categoryMappings,
                mappedTagIds: input.tagMappings,
                desiredPostStatus: (readiness.decision === "APPROVED_FOR_PUBLISHING" || readiness.decision === "SCHEDULED") ? "publish" : "draft",
                desiredPublishTime: input.schedulingRequest?.desiredPublishTime,
                timezone: input.schedulingRequest?.timezone,
            },

            auditAndProvenance: {
                upstreamProvidersAndModels: input.upstreamProvenance?.models || [],
                repairAttemptCount: 0,
                sourceVersionHashes: { [input.articleVersionId]: originalPhaseCHash },
                finalPackageHash: "",
                qualityConfigurationVersion: "1.0.0",
                promptConfigurationVersionReferences: [],
                costSummary: input.upstreamCostSummary || {},
                decisionEvents: [{ decision: readiness.decision, reasons: readiness.reasons }],
                sanitizedFailureReasons: readiness.reasons
            }
        });
        
        const finalHash = generateFinalPackageHash(pkg);
        const pkgWithHash = deepFreeze({
            ...pkg,
            auditAndProvenance: {
                ...pkg.auditAndProvenance,
                finalPackageHash: finalHash
            }
        });

        return { pkg: pkgWithHash, decision: readiness.decision, reasons: readiness.reasons };

    } catch (e) {
        return { pkg: null, decision: "TECHNICAL_FAILURE", reasons: ["Persistence exception", String(e)] };
    }
}
