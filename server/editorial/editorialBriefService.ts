import { EditorialBriefSchema } from "./schemas";
import { EditorialBrief } from "./types";

export function validateEditorialBrief(data: any): { success: boolean; data?: EditorialBrief; error?: any } {
  const result = EditorialBriefSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
