import type { RequestHandler } from "express";
import { AppError } from "./errors.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.session.user) return next(new AppError(401, "Sign in to continue", "UNAUTHENTICATED"));
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.session.user) return next(new AppError(401, "Sign in to continue", "UNAUTHENTICATED"));
  if (req.session.user.role !== "ADMIN") return next(new AppError(403, "Administrator access required", "FORBIDDEN"));
  next();
};
