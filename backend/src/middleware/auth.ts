import type { RequestHandler } from "express";
import { AppError } from "./error";
import { verifyAccessToken } from "../services/tokens";
import { SESSION_COOKIE } from "../utils/cookies";
import type { User } from "../validations";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export const authGuard: RequestHandler = async (req, _res, next) => {
  const token =
    req.headers.authorization?.match(/^Bearer (.+)$/)?.[1] ??
    req.cookies?.[SESSION_COOKIE];
  if (!token) throw new AppError(401, "Please sign in to continue.");

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub!,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
    };
    next();
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }
};
