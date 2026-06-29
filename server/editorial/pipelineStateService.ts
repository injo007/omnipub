import { ArticlePipelineState, PipelineStateTransition } from "./types";
import { PipelineStateEnum } from "./schemas";

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
  
  if(!validatePipelineState(newState)) {
     throw new Error("Invalid state: " + newState);
  }

  const previousState = transitionsList.length > 0 
    ? transitionsList[transitionsList.length - 1].newState 
    : "NONE";

  const transition: PipelineStateTransition = {
    articleTraceId,
    previousState,
    newState,
    timestamp: new Date().toISOString(),
    responsibleAgent,
    modelUsed,
    reason
  };

  transitionsList.push(transition);
  return transitionsList;
}
