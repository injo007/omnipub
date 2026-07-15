import { ArticlePipelineState, PipelineStateTransition } from "./types";
import { PipelineStateEnum } from "./schemas";

// ---------------------------------------------------------------------------
// Allowed State Transition Graph
// ---------------------------------------------------------------------------
// Every legitimate from → to pair is listed here. Any transition not in this
// map is rejected immediately, preventing silent gate-skipping bugs.
//
// Rules:
//  - Terminal states map to an empty array (no outbound transitions).
//  - NEEDS_MANUAL_REVIEW allows re-entry to RESEARCHING (after human fixes
//    the source) or promotion to APPROVED_FOR_PUBLISHING (after human approves).
//  - "NONE" is the implicit initial state (no previous transition recorded).
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  NONE:                    ["DISCOVERED", "RESEARCHING"],   // bootstrap
  DISCOVERED:              ["RESEARCHING"],
  RESEARCHING:             ["RESEARCHED", "RESEARCH_FAILED"],
  RESEARCH_FAILED:         ["RESEARCHING"],                  // retry only
  RESEARCHED:              ["BRIEF_BUILDING"],
  BRIEF_BUILDING:          ["BRIEF_READY", "BRIEF_INVALID"],
  BRIEF_INVALID:           ["BRIEF_BUILDING"],               // rebuild only
  BRIEF_READY:             ["DRAFTING"],
  DRAFTING:                ["DRAFTED", "DRAFT_FAILED", "NEEDS_RESEARCH"],
  DRAFT_FAILED:            ["DRAFTING", "NEEDS_MANUAL_REVIEW"],
  NEEDS_RESEARCH:          ["RESEARCHING"],
  DRAFTED:                 ["NATURAL_EDITING"],
  NATURAL_EDITING:         ["NATURAL_EDITED", "NATURAL_EDIT_FAILED"],
  NATURAL_EDIT_FAILED:     ["NATURAL_EDITING", "NEEDS_MANUAL_REVIEW"],
  NATURAL_EDITED:          ["SOURCE_GROUNDING"],
  SOURCE_GROUNDING:        ["SOURCE_GROUNDED", "NEEDS_MANUAL_REVIEW"],
  SOURCE_GROUNDED:         ["VALIDATING"],
  VALIDATING:              ["APPROVED_FOR_MEDIA", "APPROVED_FOR_PUBLISHING", "VALIDATION_FAILED", "NEEDS_MANUAL_REVIEW"],
  VALIDATION_FAILED:       ["VALIDATING", "NEEDS_MANUAL_REVIEW"],
  APPROVED_FOR_MEDIA:      ["APPROVED_FOR_PUBLISHING", "NEEDS_MANUAL_REVIEW"],
  APPROVED_FOR_PUBLISHING: ["PUBLISHED", "PUBLISH_FAILED"],
  PUBLISH_FAILED:          ["APPROVED_FOR_PUBLISHING"],      // retry publish only
  NEEDS_MANUAL_REVIEW:     ["RESEARCHING", "APPROVED_FOR_PUBLISHING"], // human intervention
  PLAN_INVALID:            ["BRIEF_BUILDING"],               // replan
  PUBLISHED:               [],                              // terminal — no outbound
} as const;

export class IllegalStateTransitionError extends Error {
  constructor(from: string, to: string, articleTraceId: string) {
    const allowed = ALLOWED_TRANSITIONS[from];
    const allowedStr = allowed?.length ? allowed.join(", ") : "none (terminal state)";
    super(
      `[${articleTraceId}] Illegal pipeline state transition: ${from} → ${to}. ` +
      `Allowed from "${from}": ${allowedStr}`
    );
    this.name = "IllegalStateTransitionError";
  }
}

export function validatePipelineState(state: string): boolean {
  return PipelineStateEnum.safeParse(state).success;
}

export function recordStateTransition(
  transitionsList: PipelineStateTransition[],
  articleTraceId: string,
  newState: ArticlePipelineState,
  responsibleAgent: string,
  modelUsed: string,
  reason: string = ""
): PipelineStateTransition[] {

  if (!validatePipelineState(newState)) {
    throw new Error(`[${articleTraceId}] Invalid pipeline state name: "${newState}"`);
  }

  const previousState: string =
    transitionsList.length > 0
      ? transitionsList[transitionsList.length - 1].newState
      : "NONE";

  // Enforce the transition graph. Unknown from-states (e.g. a state that was
  // added to the enum but not yet to the graph) are treated as blocking errors
  // so the omission is caught during testing rather than silently allowed.
  const allowedNext = ALLOWED_TRANSITIONS[previousState];
  if (allowedNext === undefined) {
    throw new IllegalStateTransitionError(
      `UNKNOWN(${previousState})`,
      newState,
      articleTraceId
    );
  }
  if (!allowedNext.includes(newState)) {
    throw new IllegalStateTransitionError(previousState, newState, articleTraceId);
  }

  const transition: PipelineStateTransition = {
    articleTraceId,
    previousState,
    newState,
    timestamp: new Date().toISOString(),
    responsibleAgent,
    modelUsed,
    reason,
  };

  transitionsList.push(transition);
  return transitionsList;
}
