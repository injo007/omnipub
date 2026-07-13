import { describe, expect, it } from "vitest";
import { getDocumentStore, resetInMemoryDocumentStore } from "../../db/documentStore";
import { upsertRow } from "../../db/postgres";

describe("PostgreSQL persistence security boundaries", () => {
  it("uses a strict collection-to-table allowlist", () => {
    resetInMemoryDocumentStore();
    expect(() => getDocumentStore().collection("publishing_queue")).not.toThrow();
    expect(() => getDocumentStore().collection("workflow_runs")).not.toThrow();
    expect(() => getDocumentStore().collection("model_calls")).not.toThrow();
    expect(() => getDocumentStore().collection("editorial_repair_records")).not.toThrow();
    expect(() => getDocumentStore().collection("media_assets")).not.toThrow();
    expect(() => getDocumentStore().collection("users; DROP TABLE users")).toThrow("Unsupported database collection");
  });

  it("does not expose arbitrary SQL through document identifiers", async () => {
    resetInMemoryDocumentStore();
    const maliciousId = "x; DROP TABLE publishing_queue";
    const ref = getDocumentStore().collection("publishing_queue").doc(maliciousId);
    await ref.set({ status: "QUEUED" });
    expect((await ref.get()).data()).toEqual({ status: "QUEUED" });
  });

  it("rejects arbitrary table names in the PostgreSQL CRUD layer", async () => {
    await expect(upsertRow("users; DROP TABLE users", "malicious", {}))
      .rejects.toThrow("Unsupported PostgreSQL table");
  });
});
