import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { AppError } from "../../middleware/errors.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);
const productInput = z.object({ name: z.string().trim().min(2).max(160), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(2000), category: z.string().trim().min(2).max(60), imageUrl: z.string().url(), priceCents: z.number().int().min(1).max(100000000), stock: z.number().int().min(0).max(1000000), active: z.boolean().default(true) });


adminRouter.get("/orders", asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({ include: { user: { select: { name: true, email: true } }, items: true }, orderBy: { createdAt: "desc" }, take: 50 });
  res.json({ data: orders });
}));

adminRouter.get("/summary", asyncHandler(async (_req, res) => {
  const [products, orders, revenue, lowStock] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { in: ["PAID", "PROCESSING", "SHIPPED"] } }, _sum: { totalCents: true } }),
    prisma.product.count({ where: { active: true, stock: { lte: 5 } } })
  ]);
  res.json({ data: { products, orders, revenueCents: revenue._sum.totalCents ?? 0, lowStock } });
}));

adminRouter.post("/products", asyncHandler(async (req, res) => {
  const input = productInput.parse(req.body);
  const product = await prisma.product.create({ data: input });
  res.status(201).json({ data: product });
}));

adminRouter.patch("/products/:id", asyncHandler(async (req, res) => {
  const input = productInput.partial().parse(req.body);
  const result = await prisma.product.updateMany({ where: { id: req.params.id }, data: input });
  if (!result.count) throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  res.json({ data: product });
}));

adminRouter.patch("/orders/:id/status", asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(["PAID", "PROCESSING", "SHIPPED", "CANCELLED"]) }).parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  const allowed: Record<string, string[]> = { PENDING: ["PAID", "CANCELLED"], PAID: ["PROCESSING", "CANCELLED"], PROCESSING: ["SHIPPED"], SHIPPED: [], CANCELLED: [] };
  if (!allowed[order.status]?.includes(status)) throw new AppError(409, `Cannot change order from ${order.status} to ${status}`, "INVALID_ORDER_TRANSITION");
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status } });
  res.json({ data: updated });
}));
