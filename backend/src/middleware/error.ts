import type { ErrorRequestHandler } from "express";
import { ZodError, z } from "zod";
import { logger } from "../providers/logger";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      error: {
        message: "Check the highlighted fields.",
        fields: z.flattenError(error).fieldErrors,
      },
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { message: error.message } });
    return;
  }
  if (error.code === "23505") {
    res.status(409).json({
      error: { message: "An account with this email already exists." },
    });
    return;
  }
  if (error.type === "entity.parse.failed") {
    res
      .status(400)
      .json({ error: { message: "Request body must be valid JSON." } });
    return;
  }
  logger.error("Unhandled error", {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : error,
  });
  res.status(500).json({
    error: { message: "Something went wrong. Please try again." },
  });
};
