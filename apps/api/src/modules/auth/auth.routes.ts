import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { AppError } from "../../middleware/errors.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();
const credentialsSchema = z.object({ email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(8).max(128) });
const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(100) });

function publicUser(user: { id: string; email: string; name: string; role: "CUSTOMER" | "ADMIN" }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

authRouter.post("/register", asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with this email already exists", "EMAIL_IN_USE");
  const user = await prisma.user.create({ data: { email: input.email, name: input.name, passwordHash: await bcrypt.hash(input.password, 12) }, select: { id: true, email: true, name: true, role: true } });
  req.session.user = publicUser(user);
  res.status(201).json({ data: publicUser(user) });
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const input = credentialsSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError(401, "Email or password is incorrect", "INVALID_CREDENTIALS");
  await new Promise<void>((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
  req.session.user = publicUser(user);
  res.json({ data: publicUser(user) });
}));

authRouter.post("/logout", requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("nexora.sid", { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true" });
    res.status(204).end();
  });
});

authRouter.get("/me", requireAuth, (req, res) => res.json({ data: req.session.user }));
