import { ArticleVersion } from "./types";
import { v4 as uuidv4 } from "uuid";

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
