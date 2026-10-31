import { Router } from "express";
import { Prisma } from "@prisma/client";
import { createOrderSchema } from "@nexora/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { AppError } from "../../middleware/errors.js";
import { requireAuth } from "../../middleware/auth.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.post("/", asyncHandler(async (req, res) => {
  const input = createOrderSchema.parse(req.body);
  const userId = req.session.user!.id;
  const existing = await prisma.order.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } }, include: { items: true } });
  if (existing) { res.status(200).json({ data: existing, meta: { replayed: true } }); return; }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const ids = [...new Set(input.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: ids }, active: true } });
      if (products.length !== ids.length) throw new AppError(400, "One or more products are unavailable", "PRODUCT_UNAVAILABLE");
      const byId = new Map(products.map((product) => [product.id, product]));
      const lineItems = input.items.map((item) => {
        const product = byId.get(item.productId)!;
        if (product.stock < item.quantity) throw new AppError(409, `${product.name} does not have enough stock`, "INSUFFICIENT_STOCK");
        return { product, quantity: item.quantity };
      });
      // Conditional updates prevent two concurrent orders from overselling the same stock.
      for (const line of lineItems) {
        const updated = await tx.product.updateMany({ where: { id: line.product.id, active: true, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
        if (updated.count !== 1) throw new AppError(409, `${line.product.name} just went out of stock`, "INSUFFICIENT_STOCK");
      }
      const totalCents = lineItems.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
      return tx.order.create({ data: {
        userId, idempotencyKey: input.idempotencyKey, totalCents,
        items: { create: lineItems.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, unitPriceCents: product.priceCents, quantity })) }
      }, include: { items: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json({ data: order, meta: { replayed: false } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const replay = await prisma.order.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } }, include: { items: true } });
      if (replay) { res.status(200).json({ data: replay, meta: { replayed: true } }); return; }
    }
    throw error;
  }
}));

ordersRouter.get("/", asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({ where: { userId: req.session.user!.id }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 50 });
  res.json({ data: orders });
}));
