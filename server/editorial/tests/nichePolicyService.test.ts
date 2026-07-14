import { beforeEach, describe, expect, it } from "vitest";
import { getDocumentStore, resetInMemoryDocumentStore } from "../../db/documentStore";
import { resolveNicheEditorialPolicy } from "../nichePolicyService";

describe("niche editorial policies", () => {
  beforeEach(() => resetInMemoryDocumentStore());

  it("seeds a technology policy with technology-appropriate formats", async () => {
    const policy = await resolveNicheEditorialPolicy("tech", "New security update for a device");
    expect(policy.playbook.playbookId).toBe("TECH_PRODUCT_EXPLAINER");
    expect(policy.allowedFormatIds).toContain("comparison_brief");
    expect((await getDocumentStore().collection("niche_playbooks").doc("technology").get()).exists).toBe(true);
  });

  it("honors a stored policy override", async () => {
    await getDocumentStore().collection("niche_playbooks").doc("travel").set({
      policyId: "travel", version: 2, allowedFormatIds: ["decision_guide"], playbook: { toneBoundaries: ["precise"] },
    });
    const policy = await resolveNicheEditorialPolicy("travel", "Hotel update");
    expect(policy.version).toBe(2);
    expect(policy.allowedFormatIds).toEqual(["decision_guide"]);
    expect(policy.playbook.toneBoundaries).toEqual(["precise"]);
  });
});
