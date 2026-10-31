import { Router } from "express";
import { productQuerySchema } from "@nexora/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { AppError } from "../../middleware/errors.js";

export const catalogRouter = Router();

catalogRouter.get("/", asyncHandler(async (req, res) => {
  const query = productQuerySchema.parse(req.query);
  const where = {
    active: true,
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" as const } }, { description: { contains: query.q, mode: "insensitive" as const } }] } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined ? { priceCents: { ...(query.minPrice !== undefined ? { gte: Math.round(query.minPrice * 100) } : {}), ...(query.maxPrice !== undefined ? { lte: Math.round(query.maxPrice * 100) } : {}) } } : {})
  };
  const orderBy = query.sort === "price-asc" ? { priceCents: "asc" as const } : query.sort === "price-desc" ? { priceCents: "desc" as const } : { createdAt: "desc" as const };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (query.page - 1) * query.limit, take: query.limit, select: { id: true, name: true, slug: true, description: true, category: true, imageUrl: true, priceCents: true, stock: true } }),
    prisma.product.count({ where })
  ]);
  res.json({ data: items, meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
}));

catalogRouter.get("/:slug", asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({ where: { slug: req.params.slug, active: true }, select: { id: true, name: true, slug: true, description: true, category: true, imageUrl: true, priceCents: true, stock: true } });
  if (!product) throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  res.json({ data: product });
}));
