import { describe, expect, it } from "vitest";
import { createOrderSchema, productQuerySchema } from "@nexora/shared";

describe("request schemas", () => {
  it("applies pagination defaults and caps page size", () => {
    expect(productQuerySchema.parse({}).limit).toBe(12);
    expect(productQuerySchema.safeParse({ limit: 1000 }).success).toBe(false);
  });
  it("rejects an inverted price range", () => {
    expect(productQuerySchema.safeParse({ minPrice: 20, maxPrice: 10 }).success).toBe(false);
  });
  it("requires an idempotency key and positive quantity", () => {
    const productId = "c6a1e7b5-b10d-4c92-9a2f-7b62a2e5a001";
    expect(createOrderSchema.safeParse({ items: [{ productId, quantity: 0 }], idempotencyKey: "request-1234" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ items: [{ productId, quantity: 1 }], idempotencyKey: "request-1234" }).success).toBe(true);
  });
});
