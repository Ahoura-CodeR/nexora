import { beforeAll, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";

// The session store is lazy; these tests cover the HTTP surface without needing a live database.
let app: Express;
beforeAll(() => { app = createApp(); });
afterAll(() => undefined);

describe("HTTP basics", () => {
  it("exposes a health endpoint", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.headers["x-request-id"]).toBeTruthy();
  });
  it("returns a stable not-found response", async () => {
    const response = await request(app).get("/api/not-a-route");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
