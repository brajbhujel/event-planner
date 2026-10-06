import type { RequestHandler } from "express";
import { logger } from "../providers/logger";

export const requestMiddleware: RequestHandler = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
};
