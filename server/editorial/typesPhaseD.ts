import { z } from "zod";
import * as schemas from "./phaseDSchemas";

export type PhaseDDecision = z.infer<typeof schemas.PhaseDDecisionEnum>;
export type PhaseDInputContract = z.infer<typeof schemas.PhaseDInputContractSchema>;
export type FinalArticlePackage = z.infer<typeof schemas.FinalArticlePackageSchema>;
export type WordpressPayload = z.infer<typeof schemas.WordpressPayloadSchema>;
export type PhaseDAuditEvent = z.infer<typeof schemas.PhaseDAuditEventSchema>;
