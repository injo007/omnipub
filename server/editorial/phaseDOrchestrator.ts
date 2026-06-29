import { PhaseDInputContract, FinalArticlePackage, PhaseDDecision, WordpressPayload } from "./typesPhaseD";
import { PhaseDInputContractSchema } from "./phaseDSchemas";
import { buildFinalArticlePackage, generateHash } from "./finalArticlePackageService";
import { buildWordpressPayload } from "./wordpressPayloadBuilder";
import { createAuditLog } from "./phaseDAuditService";
import { IPhaseDPackageRepository } from "./phaseDPackageRepository";

export class PhaseDOrchestrator {
    private repository: IPhaseDPackageRepository;

    constructor(repository: IPhaseDPackageRepository) {
        if (!repository) {
            throw new Error("Missing production persistence configuration");
        }
        this.repository = repository;
    }

    async executePhaseD(unvalidatedInput: any, originalPhaseCHash: string): Promise<{ decision: PhaseDDecision, pkg?: FinalArticlePackage, wpPayload?: WordpressPayload, error?: string }> {
        // 1. Runtime Validation
        const validationResult = PhaseDInputContractSchema.safeParse(unvalidatedInput);
        if (!validationResult.success) {
            createAuditLog(unvalidatedInput?.articleId || "UNKNOWN", unvalidatedInput?.workflowRunId || "UNKNOWN", "VALIDATE_INPUT", "CONTRACT_VALIDATION_FAILED", "TECHNICAL_FAILURE", [validationResult.error.message]);
            console.error(validationResult.error); return { decision: "TECHNICAL_FAILURE", error: "Input validation failed: " + validationResult.error.message };
        }
        const input: PhaseDInputContract = validationResult.data;

        const startEvent = createAuditLog(input.articleId, input.workflowRunId, "START_PHASE_D", "PHASE_D_STARTED");
        try {
            await this.repository.persistDecisionEvent(startEvent);
        } catch {
            return { decision: "TECHNICAL_FAILURE", error: "Audit persistence failed" };
        }

        // Idempotency key
        const idempotencyKey = generateHash(`${input.articleId}_${input.articleVersionId}_${originalPhaseCHash}_${input.targetWordpressSiteId}`);

        // Idempotency check
        const existingPkg = await this.repository.getByIdempotencyKey(idempotencyKey);

        if (existingPkg) {
            const idempotentEvent = createAuditLog(input.articleId, input.workflowRunId, "IDEMPOTENT_RETURN", "IDEMPOTENCY_DETECTED", existingPkg.packageStatus);
            try {
                await this.repository.persistDecisionEvent(idempotentEvent);
            } catch {
                return { decision: "TECHNICAL_FAILURE", error: "Audit persistence failed" };
            }
            return { decision: existingPkg.packageStatus, pkg: existingPkg };
        }

        const { pkg, decision, reasons } = buildFinalArticlePackage(input, originalPhaseCHash);

        const evalEvent = createAuditLog(input.articleId, input.workflowRunId, "EVALUATE_READINESS", "DECISION_PRODUCED", decision, reasons);
        try {
            await this.repository.persistDecisionEvent(evalEvent);
        } catch {
            return { decision: "TECHNICAL_FAILURE", error: "Audit persistence failed" };
        }

        let savedPkg: FinalArticlePackage | undefined;
        if (pkg) {
            try {
                savedPkg = await this.repository.createIfAbsent(idempotencyKey, pkg);
            } catch (e) {
                return { decision: "TECHNICAL_FAILURE", error: String(e) };
            }
        }

        if (decision === "APPROVED_FOR_PUBLISHING" || decision === "SCHEDULED") {
            if (savedPkg) {
                const wpPayload = buildWordpressPayload(savedPkg);
                const payloadEvent = createAuditLog(input.articleId, input.workflowRunId, "GENERATE_WP_PAYLOAD", "PAYLOAD_GENERATED", decision);
                try {
                    await this.repository.persistDecisionEvent(payloadEvent);
                } catch {
                    return { decision: "TECHNICAL_FAILURE", error: "Audit persistence failed" };
                }
                return { decision, pkg: savedPkg, wpPayload };
            }
        }

        return { decision, pkg: savedPkg };
    }
}
