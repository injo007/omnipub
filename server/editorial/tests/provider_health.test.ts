process.env.NODE_ENV = "test";

import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "../../../server";

describe("provider health endpoints", () => {
  it("rejects an OpenRouter model sent to the native MiniMax diagnostic", async () => {
    const app = buildApp({});
    const response = await request(app)
      .post("/api/saas-settings/test-minimax")
      .send({ modelId: "cohere/north-mini-code:free" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ status: "failed" });
    expect(response.body.message).toMatch(/not the native MiniMax provider/i);
  });
});
