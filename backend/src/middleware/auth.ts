import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { db } from "../config/db";
import { AppError } from "./error";
import type { User } from "../validations";

declare global {
  namespace Express {
    interface Request {
      user: User;
      sessionId: string;
    }
  }
}

export const authGuard: RequestHandler = async (req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AppError(401, "Please sign in to continue.");

  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (typeof decoded === "string" || !decoded.sub || !decoded.jti) {
      throw new Error("Invalid claims");
    }
    payload = decoded;
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  const user = await db("sessions as s")
    .join("users as u", "u.id", "s.user_id")
    .where({ "s.id": payload.jti, "u.id": payload.sub })
    .where("s.expires_at", ">", db.fn.now())
    .select("u.id", "u.name", "u.email")
    .first();

  if (!user) {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  req.user = user;
  req.sessionId = payload.jti!;
  next();
};
