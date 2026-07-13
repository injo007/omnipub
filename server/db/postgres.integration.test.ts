import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDocumentStore } from "./documentStore";
import { closePool, deleteRow, initSchema, selectOne, upsertRow } from "./postgres";

const describeWithPostgres = process.env.TEST_POSTGRES === "true" ? describe : describe.skip;

describeWithPostgres("PostgreSQL integration", () => {
  const recordId = `integration-${randomUUID()}`;
  const transactionId = `transaction-${randomUUID()}`;

  beforeAll(async () => {
    await initSchema();
  });

  afterAll(async () => {
    await deleteRow("notifications", recordId);
    await deleteRow("publishing_queue", transactionId);
    await closePool();
  });

  it("persists and reads JSONB records through the PostgreSQL CRUD layer", async () => {
    await upsertRow("notifications", recordId, { title: "database check", nested: { ok: true } });
    await expect(selectOne("notifications", recordId)).resolves.toMatchObject({
      id: recordId,
      title: "database check",
      nested: { ok: true },
    });
  });

  it("rolls back a failed queue transaction atomically", async () => {
    const store = getDocumentStore();
    const ref = store.collection("publishing_queue").doc(transactionId);
    await ref.set({ status: "QUEUED", attempts: 0 });

    await expect(store.runTransaction(async (transaction) => {
      await transaction.update(ref, { status: "LEASED", attempts: 1 });
      throw new Error("force rollback");
    })).rejects.toThrow("force rollback");

    await expect(ref.get().then((snapshot) => snapshot.data())).resolves.toEqual({
      status: "QUEUED",
      attempts: 0,
    });
  });

  it("rejects dynamic table-name injection before executing SQL", async () => {
    await expect(upsertRow("notifications; DROP TABLE notifications", recordId, {}))
      .rejects.toThrow("Unsupported PostgreSQL table");
  });
});
