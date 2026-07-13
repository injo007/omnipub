import { ArticleVersion } from "./types";
import { randomUUID as uuidv4 } from "crypto";

export function createVersion(
  articleTraceId: string,
  versionType: string,
  content: string,
  createdByAgent: string,
  requestedModel: string,
  actualModel: string,
  parentVersionId: string = "",
  claimsUsed: string[] = [],
  qualitySnapshot: any = {}
): ArticleVersion {
  return {
    versionId: uuidv4(),
    articleTraceId,
    versionType,
    content,
    createdByAgent,
    requestedModel,
    actualModel,
    createdAt: new Date().toISOString(),
    parentVersionId,
    claimsUsed,
    qualitySnapshot
  };
}
