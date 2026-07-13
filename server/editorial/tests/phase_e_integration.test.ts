import { beforeEach, describe, expect, it } from "vitest";
import { getDocumentStore, resetInMemoryDocumentStore, seedDocument } from "../../db/documentStore";

describe("PostgreSQL document transaction compatibility", () => {
  beforeEach(() => resetInMemoryDocumentStore());

  it("commits document writes atomically", async () => {
    const store = getDocumentStore();
    const ref = store.collection("publishing_queue").doc("job-a");
    await store.runTransaction(async (transaction) => {
      await transaction.set(ref, { jobId: "job-a", status: "QUEUED", revision: 0 });
      await transaction.update(ref, { status: "LEASED", revision: 1 });
    });
    expect((await ref.get()).data()).toMatchObject({ status: "LEASED", revision: 1 });
  });

  it("supports dotted JSONB-style updates", async () => {
    const store = getDocumentStore();
    await seedDocument("phase_d_packages", "pkg-a", { publishingTarget: { wordpressSiteId: "site-a" } });
    const ref = store.collection("phase_d_packages").doc("pkg-a");
    await ref.update({ "publishingTarget.permalinkPreview": "https://site.test/post" });
    expect((await ref.get()).data()?.publishingTarget.permalinkPreview).toBe("https://site.test/post");
  });

  it("filters equality and IN queries", async () => {
    await seedDocument("publishing_queue", "a", { status: "QUEUED", nextRunAt: "2026-01-01" });
    await seedDocument("publishing_queue", "b", { status: "PUBLISHED", nextRunAt: "2026-01-02" });
    await seedDocument("publishing_queue", "c", { status: "RETRY_WAIT", nextRunAt: "2026-01-03" });
    const snapshot = await getDocumentStore().collection("publishing_queue")
      .where("status", "in", ["QUEUED", "RETRY_WAIT"]).get();
    expect(snapshot.docs.map((doc) => doc.id).sort()).toEqual(["a", "c"]);
  });

  it("orders and limits queue records", async () => {
    await seedDocument("publishing_queue", "a", { nextRunAt: "2026-01-01" });
    await seedDocument("publishing_queue", "b", { nextRunAt: "2026-01-03" });
    await seedDocument("publishing_queue", "c", { nextRunAt: "2026-01-02" });
    const snapshot = await getDocumentStore().collection("publishing_queue")
      .orderBy("nextRunAt", "desc").limit(2).get();
    expect(snapshot.docs.map((doc) => doc.id)).toEqual(["b", "c"]);
  });

  it("deletes records durably", async () => {
    const ref = getDocumentStore().collection("publishing_queue").doc("job-a");
    await ref.set({ status: "QUEUED" });
    await ref.delete();
    expect((await ref.get()).exists).toBe(false);
  });

  it("rejects unknown collection names", () => {
    expect(() => getDocumentStore().collection("untrusted_table_name")).toThrow("Unsupported database collection");
  });
});
