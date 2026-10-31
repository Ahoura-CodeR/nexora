import express from "express";
import { randomUUID } from "node:crypto";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { RedisStore } from "connect-redis";
import rateLimit from "express-rate-limit";
import { env } from "./config.js";
import { redis } from "./lib/redis.js";
import { logger } from "./lib/logger.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => {
    const requestId = req.header("x-request-id")?.slice(0, 100) || randomUUID();
    res.setHeader("x-request-id", requestId);
    next();
  });
  app.use(session({
    name: "nexora.sid", store: new RedisStore({ client: redis, prefix: "nexora:sess:" }),
    secret: env.SESSION_SECRET, resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: env.COOKIE_SECURE === "true", maxAge: 1000 * 60 * 60 * 24 * 7 }
  }));
  app.use((req, res, next) => { logger.info({ requestId: res.getHeader("x-request-id"), method: req.method, path: req.path }, "request"); next(); });
  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }), authRouter);
  app.use("/api/products", catalogRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/admin", adminRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
